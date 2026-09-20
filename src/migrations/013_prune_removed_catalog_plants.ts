import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import { plannedVarietyRename } from './mergedPlantNamesLogic';
import {
  MERGED_SURVIVOR_TYPE_V13,
  REMOVED_CATALOG_PLANTS_V13,
  RENAMED_PLANT_NAMES_V13,
  planRemovedCatalogPrune,
  planStrandedRename,
} from './removedCatalogPlantsLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANTS_COLLECTION = 'plants';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/** Firestore caps a batch at 500 writes, and an `in` filter at 10 values. */
const BATCH_LIMIT = 500;
const IN_FILTER_LIMIT = 10;

/** Every name the prune list covers, flattened for the in-use query. */
const REMOVED_NAMES: string[] = Object.values(REMOVED_CATALOG_PLANTS_V13).flatMap((names) =>
  Object.keys(names)
);

/**
 * Clears plants the bundled catalog dropped, and finishes the Pepper rename.
 *
 * Two jobs, in this order: garden plants still recorded as `Pepper` are renamed
 * onto `Capsicum`, then the stored catalog overrides are pruned. Renaming first
 * matters for the same reason it did in 009 — the prune reads the garden to
 * decide what is in use, and a plant that has already moved to `Capsicum` must
 * not make `Pepper` look like a name still in service.
 *
 * Idempotent: a second run finds no plants on the old name and no un-tombstoned
 * entry to prune, and writes nothing.
 */
export async function pruneRemovedCatalogPlants(userId: string): Promise<void> {
  await renameStrandedPlants(userId);
  const inUse = await loadInUseNames(userId);
  await migrateStoredProfiles(userId, inUse);
}

async function renameStrandedPlants(userId: string): Promise<void> {
  const strandedNames = Object.keys(RENAMED_PLANT_NAMES_V13);

  const snapshot = await withTimeoutAndRetry(
    () =>
      getDocs(
        query(
          collection(db, PLANTS_COLLECTION),
          where('user_id', '==', userId),
          where('plant_variety', 'in', strandedNames)
        )
      ),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  if (snapshot.empty) return;

  const targets = snapshot.docs
    .map((snap) => ({
      ref: snap.ref,
      to: plannedVarietyRename(snap.data().plant_variety, RENAMED_PLANT_NAMES_V13),
    }))
    .filter((item): item is { ref: typeof item.ref; to: string } => item.to !== null);

  if (targets.length === 0) return;

  for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { ref, to } of targets.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, { plant_variety: to, plant_type: MERGED_SURVIVOR_TYPE_V13[to] });
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info(`Migration 013: renamed ${targets.length} garden plant(s) onto the surviving row`);
}

/**
 * The removed names some garden plant is actually planted as.
 *
 * Those keep their stored entry whatever it looks like: the plant's detail
 * screen resolves its care profile through that name, and a tombstone would
 * leave a living plant pointing at nothing.
 */
async function loadInUseNames(userId: string): Promise<Set<string>> {
  const inUse = new Set<string>();

  for (let i = 0; i < REMOVED_NAMES.length; i += IN_FILTER_LIMIT) {
    const chunk = REMOVED_NAMES.slice(i, i + IN_FILTER_LIMIT);
    const snapshot = await withTimeoutAndRetry(
      () =>
        getDocs(
          query(
            collection(db, PLANTS_COLLECTION),
            where('user_id', '==', userId),
            where('plant_variety', 'in', chunk)
          )
        ),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
    );

    for (const snap of snapshot.docs) {
      const variety = snap.data().plant_variety;
      if (typeof variety === 'string') inUse.add(variety);
    }
  }

  if (inUse.size > 0) {
    logger.info(`Migration 013: kept ${[...inUse].join(', ')} — still planted in the garden`);
  }

  return inUse;
}

function replan(profiles: PlantProfiles, inUse: ReadonlySet<string>): PlantProfiles | null {
  const renamed = planStrandedRename(
    profiles,
    RENAMED_PLANT_NAMES_V13,
    MERGED_SURVIVOR_TYPE_V13
  );
  const pruned = planRemovedCatalogPrune(
    renamed ?? profiles,
    REMOVED_CATALOG_PLANTS_V13,
    inUse
  );
  return pruned ?? renamed;
}

async function migrateStoredProfiles(userId: string, inUse: ReadonlySet<string>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  const next = remote ? replan(remote, inUse) : null;

  if (next) {
    await withTimeoutAndRetry(
      () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: next }, { merge: true }),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
    );
  }

  // Keep the local copy in step, or the next read re-caches the dropped names
  // from AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localNext = replan(stored[0], inUse);
    if (localNext) await setData(KEYS.PLANT_PROFILES, [localNext]);
  }

  if (next) logger.info('Migration 013: plants dropped from the bundled catalog cleared');
}

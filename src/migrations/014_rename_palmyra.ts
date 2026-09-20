import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import { plannedVarietyRename } from './mergedPlantNamesLogic';
import { planStrandedRename } from './removedCatalogPlantsLogic';
import { MERGED_SURVIVOR_TYPE_V14, RENAMED_PLANT_NAMES_V14 } from './renamedPalmyraLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANTS_COLLECTION = 'plants';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/** Firestore caps a batch at 500 writes. */
const BATCH_LIMIT = 500;

/**
 * Moves everything recorded as `Palmyra` onto `Palm Tree`.
 *
 * Garden plants are renamed first, then the stored catalog override, the same
 * order 013 used for Pepper → Capsicum.
 *
 * Idempotent: a second run finds no plants on the old name and no un-tombstoned
 * entry to move, and writes nothing.
 */
export async function renamePalmyra(userId: string): Promise<void> {
  await renameGardenPlants(userId);
  await migrateStoredProfiles(userId);
}

async function renameGardenPlants(userId: string): Promise<void> {
  const oldNames = Object.keys(RENAMED_PLANT_NAMES_V14);

  const snapshot = await withTimeoutAndRetry(
    () =>
      getDocs(
        query(
          collection(db, PLANTS_COLLECTION),
          where('user_id', '==', userId),
          where('plant_variety', 'in', oldNames)
        )
      ),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  if (snapshot.empty) return;

  const targets = snapshot.docs
    .map((snap) => ({
      ref: snap.ref,
      to: plannedVarietyRename(snap.data().plant_variety, RENAMED_PLANT_NAMES_V14),
    }))
    .filter((item): item is { ref: typeof item.ref; to: string } => item.to !== null);

  if (targets.length === 0) return;

  for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { ref, to } of targets.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, { plant_variety: to, plant_type: MERGED_SURVIVOR_TYPE_V14[to] });
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info(`Migration 014: renamed ${targets.length} garden plant(s) onto Palm Tree`);
}

function replan(profiles: PlantProfiles): PlantProfiles | null {
  return planStrandedRename(profiles, RENAMED_PLANT_NAMES_V14, MERGED_SURVIVOR_TYPE_V14);
}

async function migrateStoredProfiles(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  const next = remote ? replan(remote) : null;

  if (next) {
    await withTimeoutAndRetry(
      () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: next }, { merge: true }),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
    );
  }

  // Keep the local copy in step, or the next read re-caches the old name from
  // AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localNext = replan(stored[0]);
    if (localNext) await setData(KEYS.PLANT_PROFILES, [localNext]);
  }

  if (next) logger.info('Migration 014: stored Palmyra override moved to Palm Tree');
}

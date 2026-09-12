import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles, PlantType } from '@/types/database.types';
import { planSurvivorRelocation } from './catalogRealignmentLogic';
import {
  MERGED_PLANT_NAMES_V10,
  MERGED_SURVIVOR_TYPE_V10,
  RECATEGORISED_PLANTS_V10,
} from './catalogRealignment010Logic';
import { planProfileMerge, plannedVarietyRename } from './mergedPlantNamesLogic';
import { planProfileRecategorisation, plannedTypeChange } from './recategorisedPlantsLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANTS_COLLECTION = 'plants';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/** Firestore caps a batch at 500 writes. */
const BATCH_LIMIT = 500;

/**
 * Folds `Ash Plantain` into `Banana` and re-files `Castor` under `herb`.
 *
 * Same two jobs, in the same order, as migration 009: garden plants on a
 * dropped duplicate name are renamed onto the surviving row first, then the row
 * that moved category is re-typed. Renaming first matters for the same reason —
 * nothing should reason about a plant's category until it is on its final name.
 *
 * Idempotent: a second run finds no plants on a dropped name, no plants on an
 * old category, and no overrides to move.
 */
export async function mergePlantainRetypeCastor(userId: string): Promise<void> {
  await migrateGardenPlants(userId);
  await migrateStoredProfiles(userId);
}

async function migrateGardenPlants(userId: string): Promise<void> {
  await renameMergedPlants(userId);
  await retypeMovedPlants(userId);
}

async function renameMergedPlants(userId: string): Promise<void> {
  const removedNames = Object.keys(MERGED_PLANT_NAMES_V10);

  const snapshot = await withTimeoutAndRetry(
    () =>
      getDocs(
        query(
          collection(db, PLANTS_COLLECTION),
          where('user_id', '==', userId),
          where('plant_variety', 'in', removedNames)
        )
      ),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  if (snapshot.empty) return;

  // Unlike 009, this merge crosses categories — `Ash Plantain` was a
  // `vegetable` and `Banana` is a `fruit_tree` — so the survivor's type is
  // looked up per name rather than being one constant for the whole pass.
  const targets = snapshot.docs
    .map((snap) => {
      const to = plannedVarietyRename(snap.data().plant_variety, MERGED_PLANT_NAMES_V10);
      return { ref: snap.ref, to, toType: to ? MERGED_SURVIVOR_TYPE_V10[to] : undefined };
    })
    .filter((item): item is { ref: typeof item.ref; to: string; toType: PlantType } =>
      item.to !== null && item.toType !== undefined
    );

  if (targets.length === 0) return;

  for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { ref, to, toType } of targets.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, { plant_variety: to, plant_type: toType });
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info(`Migration 010: renamed ${targets.length} garden plant(s) off a dropped row`);
}

async function retypeMovedPlants(userId: string): Promise<void> {
  const movedNames = Object.keys(RECATEGORISED_PLANTS_V10);

  // `in` takes at most 10 values, and there is one — a single query covers it.
  const snapshot = await withTimeoutAndRetry(
    () =>
      getDocs(
        query(
          collection(db, PLANTS_COLLECTION),
          where('user_id', '==', userId),
          where('plant_variety', 'in', movedNames)
        )
      ),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  if (snapshot.empty) return;

  const targets = snapshot.docs
    .map((snap) => ({
      ref: snap.ref,
      to: plannedTypeChange(
        snap.data().plant_variety,
        snap.data().plant_type,
        RECATEGORISED_PLANTS_V10
      ),
    }))
    .filter((item): item is { ref: typeof item.ref; to: NonNullable<typeof item.to> } =>
      item.to !== null
    );

  if (targets.length === 0) return;

  for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { ref, to } of targets.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, { plant_type: to });
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info(`Migration 010: re-typed ${targets.length} garden plant(s) into a new category`);
}

/**
 * Applies both plans to the stored catalog overrides, remote copy first.
 *
 * The order is 009's, and for the same reasons: the merge has to land before
 * the category pass looks anything up, and `planSurvivorRelocation` sits
 * between them because the merge renames in place and can otherwise leave
 * `Banana` on `vegetable`, a category the catalog does not offer it under.
 */
function replan(profiles: PlantProfiles): PlantProfiles | null {
  const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES_V10);
  const homed = planSurvivorRelocation(merged ?? profiles, MERGED_SURVIVOR_TYPE_V10);
  const moved = planProfileRecategorisation(homed ?? merged ?? profiles, RECATEGORISED_PLANTS_V10);
  return moved ?? homed ?? merged;
}

async function migrateStoredProfiles(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  if (!remote) return;

  const next = replan(remote);
  if (!next) return;

  await withTimeoutAndRetry(
    () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: next }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  // Keep the local copy in step, or the next read would re-cache the old keys
  // from AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localNext = replan(stored[0]);
    if (localNext) await setData(KEYS.PLANT_PROFILES, [localNext]);
  }

  logger.info('Migration 010: catalog overrides merged and moved to their new categories');
}

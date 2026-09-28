import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import {
  MERGED_PLANT_NAMES_V9,
  RECATEGORISED_PLANTS_V9,
  planSurvivorRelocation,
  MERGED_SURVIVOR_TYPE,
} from './catalogRealignmentLogic';
import { planProfileMerge, plannedVarietyRename } from './mergedPlantNamesLogic';
import { planProfileRecategorisation, plannedTypeChange } from './recategorisedPlantsLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANTS_COLLECTION = 'plants';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/** Firestore caps a batch at 500 writes. */
const BATCH_LIMIT = 500;

/**
 * Finishes the Tamil Nadu catalog pass that migration 008 started.
 *
 * Two jobs, in this order: garden plants still on a dropped duplicate name
 * (`Malabar Spinach`, `Amaranth Greens`) are renamed onto the surviving row,
 * then the six rows that moved category are re-typed. Renaming first matters —
 * a plant that arrives as `Malabar Spinach` must already be `Pasalai Keerai`
 * before anything reasons about its category.
 *
 * Idempotent: a second run finds no plants on a dropped name, no plants on an
 * old category, and no overrides to move.
 */
export async function realignCatalog(userId: string): Promise<void> {
  await migrateGardenPlants(userId);
  await migrateStoredProfiles(userId);
}

async function migrateGardenPlants(userId: string): Promise<void> {
  await renameMergedPlants(userId);
  await retypeMovedPlants(userId);
}

async function renameMergedPlants(userId: string): Promise<void> {
  const removedNames = Object.keys(MERGED_PLANT_NAMES_V9);

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

  // Both survivors live in `spinach`, so the rename carries the type with it —
  // a plant on `Malabar Spinach` may have been stored under any category.
  const targets = snapshot.docs
    .map((snap) => ({
      ref: snap.ref,
      to: plannedVarietyRename(snap.data().plant_variety, MERGED_PLANT_NAMES_V9),
    }))
    .filter((item): item is { ref: typeof item.ref; to: string } => item.to !== null);

  if (targets.length === 0) return;

  for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { ref, to } of targets.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, { plant_variety: to, plant_type: 'spinach' });
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info(`Migration 009: renamed ${targets.length} garden plant(s) off a dropped row`);
}

async function retypeMovedPlants(userId: string): Promise<void> {
  const movedNames = Object.keys(RECATEGORISED_PLANTS_V9);

  // `in` takes at most 10 values, and there are six — one query covers them.
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
        RECATEGORISED_PLANTS_V9
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

  logger.info(`Migration 009: re-typed ${targets.length} garden plant(s) into a new category`);
}

/**
 * Applies both plans to the stored catalog overrides, remote copy first.
 *
 * `planProfileMerge` runs before `planProfileRecategorisation` for the same
 * reason the garden-plant half does: an override stored under the dropped name
 * has to reach the surviving name before the category pass looks for it.
 * `planSurvivorRelocation` sits between them because the merge renames in
 * place and can leave the survivor on a category that does not offer it.
 */
function replan(profiles: PlantProfiles): PlantProfiles | null {
  const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES_V9);
  const homed = planSurvivorRelocation(merged ?? profiles, MERGED_SURVIVOR_TYPE);
  const moved = planProfileRecategorisation(homed ?? merged ?? profiles, RECATEGORISED_PLANTS_V9);
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

  logger.info('Migration 009: catalog overrides merged and moved to their new categories');
}

import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import { MERGED_PLANT_NAMES, planProfileMerge, plannedVarietyRename } from './mergedPlantNamesLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANTS_COLLECTION = 'plants';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/** Firestore caps a batch at 500 writes. */
const BATCH_LIMIT = 500;

/**
 * Folds the duplicate catalog entries (Methi/Fenugreek, Eggplant/Brinjal,
 * Moringa/Drumstick, Colocasia/Taro) onto one name each.
 *
 * Garden plants still holding a removed name are moved to the surviving one,
 * and the stored catalog overrides are re-keyed to match. Idempotent: a second
 * run finds no plants on the old names and no overrides to move.
 */
export async function mergeDuplicatePlantNames(userId: string): Promise<void> {
  await migrateGardenPlants(userId);
  await migrateStoredProfiles(userId);
}

async function migrateGardenPlants(userId: string): Promise<void> {
  const removedNames = Object.keys(MERGED_PLANT_NAMES);

  // `in` takes at most 10 values, and there are four — one query covers them.
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

  const targets = snapshot.docs
    .map((snap) => ({ ref: snap.ref, to: plannedVarietyRename(snap.data().plant_variety) }))
    .filter((item): item is { ref: typeof item.ref; to: string } => item.to !== null);

  for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { ref, to } of targets.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, { plant_variety: to });
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info(`Migration 007: moved ${targets.length} garden plant(s) onto merged names`);
}

async function migrateStoredProfiles(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  if (!remote) return;

  const merged = planProfileMerge(remote);
  if (!merged) return;

  await withTimeoutAndRetry(
    () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: merged }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  // Keep the local copy in step, or the next read would re-cache the old keys
  // from AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localMerged = planProfileMerge(stored[0]);
    if (localMerged) await setData(KEYS.PLANT_PROFILES, [localMerged]);
  }

  logger.info('Migration 007: catalog overrides re-keyed onto merged names');
}

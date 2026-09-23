import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import { DEFAULT_PLANT_PROFILES } from '@/services/plantProfiles';
import { planFoldMerge } from './mergedCashewNutLogic';
import {
  MERGED_PLANT_NAMES_V17,
  MERGED_SURVIVOR_TYPE_V17,
  MERGED_VARIETY_LABELS_V17,
  plannedGardenPlantMerge,
} from './mergedDuplicateRowsLogic';
import { STALE_TAMIL_NAMES_V17, planTamilNameRepair } from './staleTamilNamesLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANTS_COLLECTION = 'plants';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/** Firestore caps a batch at 500 writes. */
const BATCH_LIMIT = 500;

/**
 * Catalog clean-up. Folds duplicate rows into one — Long Brinjal, French
 * Beans, Red Banana and Yardlong Beans become varieties of Brinjal, Beans,
 * Banana and Cowpea, and the four coconut rows become one Coconut — and
 * repairs eight wrong Tamil names in stored entries.
 *
 * Garden plants move first (keeping what they were as their variety), then the
 * stored catalog entries, the same order 013, 014 and 016 used.
 *
 * Idempotent: a second run finds no plants on the old names and no
 * un-tombstoned entry to move, and writes nothing.
 */
export async function mergeDuplicateRows(userId: string): Promise<void> {
  await renameGardenPlants(userId);
  await migrateStoredProfiles(userId);
}

async function renameGardenPlants(userId: string): Promise<void> {
  // Eight names, inside Firestore's limit of ten for an `in` filter.
  const oldNames = Object.keys(MERGED_PLANT_NAMES_V17);

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
    .map((snap) => {
      const data = snap.data();
      return {
        ref: snap.ref,
        patch: plannedGardenPlantMerge({
          plant_variety: data.plant_variety,
          variety: data.variety,
        }),
      };
    })
    .filter(
      (item): item is { ref: typeof item.ref; patch: NonNullable<typeof item.patch> } =>
        item.patch !== null
    );

  if (targets.length === 0) return;

  for (let i = 0; i < targets.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { ref, patch } of targets.slice(i, i + BATCH_LIMIT)) {
      batch.update(ref, patch);
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info(`Migration 017: moved ${targets.length} garden plant(s) onto merged rows`);
}

function replan(profiles: PlantProfiles): PlantProfiles | null {
  const merged = planFoldMerge(
    profiles,
    MERGED_PLANT_NAMES_V17,
    MERGED_SURVIVOR_TYPE_V17,
    (type, name) => DEFAULT_PLANT_PROFILES[type]?.[name],
    Date.now(),
    MERGED_VARIETY_LABELS_V17
  );
  // Stored copies carry the bundled Tamil name they were saved with, so the
  // corrected names only reach an existing install through its stored entry.
  const repaired = planTamilNameRepair(merged ?? profiles, STALE_TAMIL_NAMES_V17);
  return repaired ?? merged;
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

  // Keep the local copy in step, or the next read re-caches the old entry from
  // AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localNext = replan(stored[0]);
    if (localNext) await setData(KEYS.PLANT_PROFILES, [localNext]);
  }

  if (next) logger.info('Migration 017: stored catalog entries merged and Tamil names repaired');
}

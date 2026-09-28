import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import {
  RECATEGORISED_PLANTS,
  planProfileRecategorisation,
  plannedTypeChange,
} from './recategorisedPlantsLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANTS_COLLECTION = 'plants';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/** Firestore caps a batch at 500 writes. */
const BATCH_LIMIT = 500;

/**
 * Moves catalog rows that changed category: Hibiscus, Ixora, Jasmine and
 * Crossandra off `shrub` onto `flower`, where they were already duplicated,
 * and Purslane off `vegetable` onto `spinach` with the other keerai.
 *
 * Garden plants recorded under the old category are re-typed, and the stored
 * catalog overrides are moved to match. Idempotent: a second run finds no
 * plants on the old category and no overrides to move.
 */
export async function recategorisePlants(userId: string): Promise<void> {
  await migrateGardenPlants(userId);
  await migrateStoredProfiles(userId);
}

async function migrateGardenPlants(userId: string): Promise<void> {
  const movedNames = Object.keys(RECATEGORISED_PLANTS);

  // `in` takes at most 10 values, and there are eight — one query covers them.
  // Filtering on the name rather than the type keeps the result small; the
  // per-doc check below is what decides whether a plant actually moves.
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
      to: plannedTypeChange(snap.data().plant_variety, snap.data().plant_type, RECATEGORISED_PLANTS),
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

  logger.info(`Migration 008: re-typed ${targets.length} garden plant(s) into a new category`);
}

async function migrateStoredProfiles(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  if (!remote) return;

  const moved = planProfileRecategorisation(remote, RECATEGORISED_PLANTS);
  if (!moved) return;

  await withTimeoutAndRetry(
    () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: moved }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  // Keep the local copy in step, or the next read would re-cache the old keys
  // from AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localMoved = planProfileRecategorisation(stored[0], RECATEGORISED_PLANTS);
    if (localMoved) await setData(KEYS.PLANT_PROFILES, [localMoved]);
  }

  logger.info('Migration 008: catalog overrides moved to their new categories');
}

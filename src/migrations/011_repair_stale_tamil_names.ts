import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import { planTamilNameRepair } from './staleTamilNamesLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/**
 * Repairs Tamil names that a stored profile copied from a wrong bundled value.
 *
 * Only the stored catalog overrides need touching: a garden plant row records
 * `plant_variety` and `plant_type`, never a Tamil name, so unlike migrations 008 and 010
 * there is no `plants`-collection pass. Idempotent — the second run finds the
 * corrected value and writes nothing.
 */
export async function repairStaleTamilNames(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  const repaired = remote ? planTamilNameRepair(remote) : null;

  if (repaired) {
    await withTimeoutAndRetry(
      () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: repaired }, { merge: true }),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
    );
  }

  // Keep the local copy in step, or the next read re-caches the stale name from
  // AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localRepaired = planTamilNameRepair(stored[0]);
    if (localRepaired) await setData(KEYS.PLANT_PROFILES, [localRepaired]);
  }

  if (repaired) logger.info('Migration 011: stale catalog Tamil names repaired');
}

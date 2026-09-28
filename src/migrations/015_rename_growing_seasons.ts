import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getData, setData, KEYS } from '@/lib/storage';
import { logger } from '@/utils/logger';
import type { PlantProfiles } from '@/types/database.types';
import { planSeasonRename } from './renamedSeasonsLogic';

const SETTINGS_COLLECTION = 'user_settings';
const PLANT_PROFILES_FIELD = 'plantProfiles';

/**
 * Moves stored catalog overrides off the Kharif/Rabi season names onto the
 * zone model's (SW Monsoon, NE Monsoon, Winter, Summer).
 *
 * Only the catalog overrides carry season values — garden plants' typed
 * `season_suitability` is never written — so this touches one document.
 *
 * Idempotent: a second run finds no retired value and writes nothing.
 */
export async function renameGrowingSeasons(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const remote = snapshot.data()[PLANT_PROFILES_FIELD] as PlantProfiles | undefined;
  const next = remote ? planSeasonRename(remote) : null;

  if (next) {
    await withTimeoutAndRetry(
      () => setDoc(docRef, { [PLANT_PROFILES_FIELD]: next }, { merge: true }),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
    );
  }

  // Keep the local copy in step, or the next read re-caches the old names from
  // AsyncStorage before the Firestore sync lands.
  const stored = await getData<PlantProfiles>(KEYS.PLANT_PROFILES);
  if (stored.length > 0 && stored[0]) {
    const localNext = planSeasonRename(stored[0]);
    if (localNext) await setData(KEYS.PLANT_PROFILES, [localNext]);
  }

  if (next) logger.info('Migration 015: stored catalog seasons moved off Kharif/Rabi');
}

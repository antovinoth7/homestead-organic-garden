import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { planFarmConfigRepair, FARM_CONFIG_FIELD } from './farmConfigRepairLogic';

const SETTINGS_COLLECTION = 'user_settings';

/**
 * Repairs accounts whose district/zone landed in the wrong shape.
 *
 * Migration 001 wrote `district` and `zone_id` as TOP-LEVEL fields on
 * user_settings, but every runtime reader looks them up inside the nested
 * `farmConfig` object (farmCapacity.ts → FARM_CONFIG_FIELD). Affected accounts
 * were stamped as migrated while still falling back to the default zone, which
 * silently skews weather and care recommendations.
 *
 * 001 has already shipped, so it is left untouched; this migration copies the
 * stranded values into `farmConfig` instead.
 *
 * Idempotent — the repair rules live in ./farmConfigRepairLogic.ts and return
 * null when nothing needs writing, so reruns after a mid-migration crash are safe.
 */
export async function repairFarmConfig(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!snapshot.exists()) return;

  const repaired = planFarmConfigRepair(snapshot.data() as Record<string, unknown>);
  if (!repaired) return;

  await withTimeoutAndRetry(
    () => setDoc(docRef, { [FARM_CONFIG_FIELD]: repaired }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );
}

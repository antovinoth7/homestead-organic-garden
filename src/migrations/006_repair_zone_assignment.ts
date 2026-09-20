import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { FARM_CONFIG_FIELD } from './farmConfigRepairLogic';
import { planZoneAssignmentRepair } from './zoneAssignmentRepairLogic';

const SETTINGS_COLLECTION = 'user_settings';

/** Repairs the high_rainfall id written for non-Kanyakumari districts. */
export async function repairZoneAssignment(userId: string): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, userId);
  const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!snapshot.exists()) return;

  const repaired = planZoneAssignmentRepair(snapshot.data() as Record<string, unknown>);
  if (!repaired) return;

  await withTimeoutAndRetry(
    () => setDoc(docRef, { [FARM_CONFIG_FIELD]: repaired }, { merge: true }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );
}

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  withTimeoutAndRetry,
  FIRESTORE_READ_TIMEOUT_MS,
  FIRESTORE_WRITE_TIMEOUT_MS,
} from '@/utils/firestoreTimeout';
import { logger } from '@/utils/logger';
import { Plant } from '@/types/database.types';
import { deriveInstanceLifecycle } from '@/utils/plantHelpers';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';

const PLANTS_COLLECTION = 'plants';

/**
 * Backfills lifecycle_type on all existing Plant documents that are missing it.
 * Derives the value from the plant's type and catalog care profile lifecycle field.
 */
export async function backfillLifecycleType(userId: string): Promise<void> {
  const q = query(collection(db, PLANTS_COLLECTION), where('user_id', '==', userId));

  const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  const toUpdate = snapshot.docs.filter((d) => !d.data().lifecycle_type);

  if (toUpdate.length === 0) {
    logger.info('004_backfill_lifecycle_type: no plants need backfill');
    return;
  }

  logger.info(`004_backfill_lifecycle_type: backfilling ${toUpdate.length} plant(s)`);

  await Promise.all(
    toUpdate.map(async (d) => {
      const data = d.data() as Plant;
      const profile = getPlantCareProfile(data.plant_variety ?? '', data.plant_type);
      const lifecycle_type = deriveInstanceLifecycle(profile?.lifecycle, data.plant_type);
      await withTimeoutAndRetry(
        () => updateDoc(doc(db, PLANTS_COLLECTION, d.id), { lifecycle_type }),
        { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
      );
    })
  );

  logger.info('004_backfill_lifecycle_type: done');
}

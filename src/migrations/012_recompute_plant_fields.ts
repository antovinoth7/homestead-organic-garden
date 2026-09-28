import { collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import type { DocumentData, UpdateData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { logger } from '@/utils/logger';
import { recomputePlantFields } from './recomputedPlantFieldsLogic';

const PLANTS_COLLECTION = 'plants';

/** Firestore caps a batch at 500 writes. */
const BATCH_LIMIT = 500;

/**
 * Recomputes `lifecycle_type` and `crop_family` on every garden plant.
 *
 * Both are derived fields that were wrong on disk — see
 * `recomputedPlantFieldsLogic.ts` for why. Unlike migration 004, which only
 * filled in a missing `lifecycle_type`, this recomputes existing values too,
 * because 004 wrote them using the rule that was itself the bug.
 *
 * Idempotent and cheap on a second run: `recomputePlantFields` returns null for
 * a plant already correct, so a re-run writes nothing.
 */
export async function recomputePlantDerivedFields(userId: string): Promise<void> {
  const snapshot = await withTimeoutAndRetry(
    () => getDocs(query(collection(db, PLANTS_COLLECTION), where('user_id', '==', userId))),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  const updates = snapshot.docs
    .map((entry) => ({ id: entry.id, changes: recomputePlantFields(entry.data()) }))
    .filter((entry): entry is { id: string; changes: NonNullable<typeof entry.changes> } =>
      entry.changes !== null
    );

  if (updates.length === 0) {
    logger.info('012_recompute_plant_fields: every plant already correct');
    return;
  }

  logger.info(`012_recompute_plant_fields: updating ${updates.length} plant(s)`);

  for (let start = 0; start < updates.length; start += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const { id, changes } of updates.slice(start, start + BATCH_LIMIT)) {
      // `UpdateData` is Firestore's own type for a partial write; the plain
      // interface has no index signature, which `update` requires.
      batch.update(doc(db, PLANTS_COLLECTION, id), changes as UpdateData<DocumentData>);
    }
    await withTimeoutAndRetry(() => batch.commit(), { timeoutMs: FIRESTORE_READ_TIMEOUT_MS });
  }

  logger.info('012_recompute_plant_fields: done');
}

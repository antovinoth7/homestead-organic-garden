import { withTimeoutAndRetry, FIRESTORE_WRITE_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getErrorCode, getErrorMessage } from '@/utils/errorLogging';
import { enqueueMutations, hasPendingMutationFor } from '@/lib/offlineQueue';
import { logger } from '@/utils/logger';
import type { OfflineMutationInput } from '@/types/offline.types';

/**
 * Shared write path for offline-capable services.
 *
 * Attempts the Firestore write; when it fails because the device is offline
 * the mutation(s) are queued for replay on reconnect (src/services/offlineSync.ts)
 * and the caller proceeds with its optimistic local-cache update. Non-network
 * errors (permission-denied, invalid-argument, …) still throw — those must
 * never be queued. A write that times out is treated as offline and queued.
 *
 * `enqueueMutations` can itself throw `OfflineQueueUnavailableError` when the
 * queue could not be read. That propagates deliberately: the mutation did not
 * reach Firestore *or* the queue, so the caller must not report success and
 * apply an optimistic cache update for a write that no longer exists anywhere.
 */

/**
 * True when the failure means "the server could not be reached", as opposed to
 * "the server refused". `deadline-exceeded` is our own timeout
 * (`FirestoreTimeoutError`): a Firestore write never rejects on a dead or
 * stalled link, it stays pending in the SDK's memory-only cache, so a timeout
 * is how a weak connection shows up. Queuing it keeps the write durable; every
 * queued op is an absolute set/update/delete, so a replay that lands after the
 * SDK's own pending copy committed is idempotent.
 */
export const isOfflineWriteError = (error: unknown): boolean => {
  const code = getErrorCode(error);
  if (code === 'unavailable' || code === 'deadline-exceeded') return true;
  return getErrorMessage(error).includes('No network connection available');
};

export interface WriteOrQueueResult {
  /** true when the write was queued for later sync instead of committed */
  queued: boolean;
}

export async function writeOrQueue(
  mutations: OfflineMutationInput | OfflineMutationInput[],
  firestoreOp: () => Promise<unknown>,
  options: { timeoutMs?: number } = {}
): Promise<WriteOrQueueResult> {
  const inputs = Array.isArray(mutations) ? mutations : [mutations];

  // An older edit to the same doc is still queued: writing this one directly
  // would let the replay land on top of it later and undo it. Queue behind it so
  // the two coalesce and replay in order.
  if (await hasPendingMutationFor(inputs)) {
    await enqueueMutations(inputs);
    logger.info(
      `Offline: queued ${inputs.length} write(s) to ${inputs[0]?.collection ?? 'unknown'} behind pending changes`
    );
    return { queued: true };
  }

  try {
    await withTimeoutAndRetry(firestoreOp, {
      timeoutMs: options.timeoutMs ?? FIRESTORE_WRITE_TIMEOUT_MS,
      // A timed-out write is still pending inside the SDK; re-sending it on the
      // same stalled link only delays queuing it by another timeout or two.
      retryOnTimeout: false,
    });
    return { queued: false };
  } catch (error) {
    if (!isOfflineWriteError(error)) throw error;
    await enqueueMutations(inputs);
    logger.info(
      `Offline: queued ${inputs.length} write(s) to ${inputs[0]?.collection ?? 'unknown'}`
    );
    return { queued: true };
  }
}

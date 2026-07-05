import { withTimeoutAndRetry, FIRESTORE_WRITE_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getErrorCode, getErrorMessage } from '@/utils/errorLogging';
import { enqueueMutations } from '@/lib/offlineQueue';
import { logger } from '@/utils/logger';
import type { OfflineMutationInput } from '@/types/offline.types';

/**
 * Shared write path for offline-capable services.
 *
 * Attempts the Firestore write; when it fails because the device is offline
 * the mutation(s) are queued for replay on reconnect (src/services/offlineSync.ts)
 * and the caller proceeds with its optimistic local-cache update. Non-network
 * errors (permission-denied, invalid-argument, …) still throw — those must
 * never be queued.
 */

export const isOfflineWriteError = (error: unknown): boolean => {
  if (getErrorCode(error) === 'unavailable') return true;
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
  try {
    await withTimeoutAndRetry(firestoreOp, {
      timeoutMs: options.timeoutMs ?? FIRESTORE_WRITE_TIMEOUT_MS,
    });
    return { queued: false };
  } catch (error) {
    if (!isOfflineWriteError(error)) throw error;
    const inputs = Array.isArray(mutations) ? mutations : [mutations];
    await enqueueMutations(inputs);
    logger.info(
      `Offline: queued ${inputs.length} write(s) to ${inputs[0]?.collection ?? 'unknown'}`
    );
    return { queued: true };
  }
}

import { doc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, refreshAuthToken } from '@/lib/firebase';
import { getQueue, removeMutation, incrementRetry } from '@/lib/offlineQueue';
import { isOfflineWriteError } from '@/lib/offlineWrite';
import { KEYS } from '@/lib/storage';
import { invalidateAll } from '@/lib/dataCache';
import { decodeTimestamps } from '@/utils/offlineQueueLogic';
import { withTimeoutAndRetry, FIRESTORE_WRITE_TIMEOUT_MS } from '@/utils/firestoreTimeout';
import { getErrorCode } from '@/utils/errorLogging';
import { safeSetItem } from '@/utils/safeStorage';
import { logger } from '@/utils/logger';
import type { OfflineMutation } from '@/types/offline.types';

/**
 * Replays queued offline mutations against Firestore once connectivity
 * returns. Triggered from App.tsx via subscribeToNetworkChanges and once on
 * startup; safe to call repeatedly (concurrent calls share one flush).
 *
 * Replay is FIFO. A failing entry stops the flush (preserving per-document
 * ordering) and is retried on the next flush, up to MAX_RETRIES before being
 * dropped. 'not-found' updates/deletes are dropped silently — the document
 * was removed remotely, so there is nothing left to apply.
 */

const MAX_RETRIES = 5;

/** Injectable for tests so replay mechanics are testable without Firestore. */
export type MutationExecutor = (mutation: OfflineMutation) => Promise<void>;

const timestampFromDate = (date: Date): Timestamp => Timestamp.fromDate(date);

const defaultExecutor: MutationExecutor = async (mutation) => {
  const ref = doc(db, mutation.collection, mutation.docId);
  const payload =
    mutation.payload === null
      ? null
      : (decodeTimestamps(mutation.payload, timestampFromDate) as Record<string, unknown>);

  await withTimeoutAndRetry(
    () => {
      switch (mutation.op) {
        case 'create':
          return setDoc(ref, payload ?? {});
        case 'set':
          return setDoc(ref, payload ?? {}, { merge: true });
        case 'update':
          return updateDoc(ref, payload ?? {});
        case 'delete':
          return deleteDoc(ref);
      }
    },
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
  );
};

export interface FlushResult {
  synced: number;
  dropped: number;
  remaining: number;
}

let flushInFlight: Promise<FlushResult> | null = null;

export const flushOfflineQueue = (
  executor: MutationExecutor = defaultExecutor
): Promise<FlushResult> => {
  if (flushInFlight) return flushInFlight;
  flushInFlight = runFlush(executor).finally(() => {
    flushInFlight = null;
  });
  return flushInFlight;
};

async function runFlush(executor: MutationExecutor): Promise<FlushResult> {
  const queue = await getQueue();
  if (queue.length === 0) return { synced: 0, dropped: 0, remaining: 0 };

  logger.info(`Offline sync: replaying ${queue.length} queued write(s)`);
  await refreshAuthToken();

  let synced = 0;
  let dropped = 0;

  for (const mutation of queue) {
    try {
      await executor(mutation);
      await removeMutation(mutation.id);
      synced += 1;
    } catch (error) {
      if ((mutation.op === 'update' || mutation.op === 'delete') && isNotFoundError(error)) {
        logger.warn(
          `Offline sync: ${mutation.collection}/${mutation.docId} no longer exists, dropping ${mutation.op}`
        );
        await removeMutation(mutation.id);
        dropped += 1;
        continue;
      }

      if (isOfflineWriteError(error)) {
        logger.warn('Offline sync: connection lost mid-flush, will retry on reconnect');
        break;
      }

      const retries = await incrementRetry(mutation.id);
      if (retries >= MAX_RETRIES) {
        logger.warn(
          `Offline sync: dropping ${mutation.op} on ${mutation.collection}/${mutation.docId} after ${retries} failed attempts`,
          error as Error
        );
        await removeMutation(mutation.id);
        dropped += 1;
        continue;
      }

      // Stop to preserve FIFO / per-document ordering; retried next flush.
      logger.warn(
        `Offline sync: replay failed (attempt ${retries}/${MAX_RETRIES}), pausing flush`,
        error as Error
      );
      break;
    }
  }

  if (synced > 0) {
    // Local optimistic state may differ from server truth — refetch lazily.
    invalidateAll();
    await safeSetItem(KEYS.LAST_SYNC, new Date().toISOString());
  }

  const remaining = (await getQueue()).length;
  logger.info(`Offline sync: ${synced} synced, ${dropped} dropped, ${remaining} remaining`);
  return { synced, dropped, remaining };
}

const isNotFoundError = (error: unknown): boolean => getErrorCode(error) === 'not-found';

import { getData, setData, KEYS } from '@/lib/storage';
import { coalesceQueue, encodeTimestamps } from '@/utils/offlineQueueLogic';
import { logger } from '@/utils/logger';
import type { OfflineMutation, OfflineMutationInput } from '@/types/offline.types';

/**
 * AsyncStorage-backed store for offline mutations (KEYS.OFFLINE_QUEUE).
 *
 * All read-modify-write operations run through a promise-chain lock so
 * concurrent enqueues/removals cannot clobber each other. Queue-count
 * subscribers power the offline banner's pending-changes badge.
 *
 * Durability is fail-closed: a write that does not reach AsyncStorage throws
 * rather than reporting success, because for an offline mutation this queue is
 * the only durable copy.
 */

const generateEntryId = (): string =>
  `om${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

/** Backfill fields added after entries may already have been persisted. */
const normalizeEntry = (mutation: OfflineMutation): OfflineMutation => ({
  ...mutation,
  revision: mutation.revision ?? 0,
  ownerUid: mutation.ownerUid ?? null,
});

const readQueue = async (): Promise<OfflineMutation[]> =>
  (await getData<OfflineMutation>(KEYS.OFFLINE_QUEUE)).map(normalizeEntry);

/** Persist the queue, throwing when the write did not actually land. */
const persistQueue = async (queue: OfflineMutation[]): Promise<void> => {
  const persisted = await setData(KEYS.OFFLINE_QUEUE, queue);
  if (!persisted) {
    throw new Error('Offline queue could not be persisted to storage');
  }
};

/**
 * uid stamped onto newly queued mutations. Injected by App.tsx's auth listener
 * rather than read from `auth` directly, so this module stays free of the
 * Firebase SDK (it is the lowest layer of the write path and must load without
 * Firebase initialization).
 */
let queueOwnerUid: string | null = null;

export const setQueueOwner = (uid: string | null): void => {
  queueOwnerUid = uid;
};

let opChain: Promise<unknown> = Promise.resolve();

const withQueueLock = <T>(operation: () => Promise<T>): Promise<T> => {
  const run = opChain.then(operation, operation);
  opChain = run.catch(() => undefined);
  return run;
};

type QueueCountListener = (count: number) => void;

const listeners = new Set<QueueCountListener>();

const notifyListeners = (count: number): void => {
  listeners.forEach((listener) => {
    try {
      listener(count);
    } catch (e) {
      logger.warn('Offline queue listener failed', e as Error);
    }
  });
};

/**
 * Subscribe to queue-length changes. Immediately pushes the current length.
 * Returns an unsubscribe function.
 */
export const subscribeQueueCount = (listener: QueueCountListener): (() => void) => {
  listeners.add(listener);
  void getQueueLength().then((count) => {
    if (listeners.has(listener)) listener(count);
  });
  return () => {
    listeners.delete(listener);
  };
};

export const getQueue = (): Promise<OfflineMutation[]> => readQueue();

export const getQueueLength = async (): Promise<number> => (await getQueue()).length;

/** Queue several mutations atomically (single storage write). */
export const enqueueMutations = (inputs: OfflineMutationInput[]): Promise<void> =>
  withQueueLock(async () => {
    let queue = await readQueue();
    const ownerUid = queueOwnerUid;
    for (const input of inputs) {
      const mutation: OfflineMutation = {
        ...input,
        payload:
          input.payload === null
            ? null
            : (encodeTimestamps(input.payload) as Record<string, unknown>),
        id: generateEntryId(),
        createdAt: Date.now(),
        retryCount: 0,
        revision: 0,
        ownerUid,
      };
      queue = coalesceQueue(queue, mutation);
    }
    await persistQueue(queue);
    logger.info(`Offline queue: ${inputs.length} mutation(s) queued (${queue.length} pending)`);
    notifyListeners(queue.length);
  });

export const enqueueMutation = (input: OfflineMutationInput): Promise<void> =>
  enqueueMutations([input]);

/**
 * Remove a replayed entry, but only if it still holds the revision that was
 * executed. A mutation enqueued while the entry was in flight coalesces into it
 * and bumps the revision; removing on a stale revision would silently discard
 * that newer edit, so the mismatch leaves the entry queued for the next flush.
 *
 * Returns true when the entry was removed.
 */
export const removeMutation = (id: string, revision?: number): Promise<boolean> =>
  withQueueLock(async () => {
    const queue = await readQueue();
    const entry = queue.find((m) => m.id === id);
    if (!entry) return false;
    if (revision !== undefined && entry.revision !== revision) {
      logger.info(
        `Offline queue: ${id} changed during replay (rev ${revision} → ${entry.revision}), keeping newer edit`
      );
      return false;
    }
    const next = queue.filter((m) => m.id !== id);
    await persistQueue(next);
    notifyListeners(next.length);
    return true;
  });

/** Bump retryCount for a queue entry; returns the new count and current revision. */
export const incrementRetry = (id: string): Promise<{ retryCount: number; revision: number }> =>
  withQueueLock(async () => {
    const queue = await readQueue();
    let retryCount = 0;
    let revision = 0;
    const next = queue.map((m) => {
      if (m.id !== id) return m;
      retryCount = m.retryCount + 1;
      revision = m.revision;
      return { ...m, retryCount };
    });
    await persistQueue(next);
    return { retryCount, revision };
  });

/**
 * Drop every queued mutation. Used only when the user explicitly chooses to
 * discard pending writes (Settings → clear cache).
 */
export const clearQueue = (): Promise<void> =>
  withQueueLock(async () => {
    await persistQueue([]);
    notifyListeners(0);
  });

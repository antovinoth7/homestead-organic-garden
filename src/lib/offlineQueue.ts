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
 */

const generateEntryId = (): string =>
  `om${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

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

export const getQueue = (): Promise<OfflineMutation[]> =>
  getData<OfflineMutation>(KEYS.OFFLINE_QUEUE);

export const getQueueLength = async (): Promise<number> => (await getQueue()).length;

/** Queue several mutations atomically (single storage write). */
export const enqueueMutations = (inputs: OfflineMutationInput[]): Promise<void> =>
  withQueueLock(async () => {
    let queue = await getData<OfflineMutation>(KEYS.OFFLINE_QUEUE);
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
      };
      queue = coalesceQueue(queue, mutation);
    }
    await setData(KEYS.OFFLINE_QUEUE, queue);
    logger.info(`Offline queue: ${inputs.length} mutation(s) queued (${queue.length} pending)`);
    notifyListeners(queue.length);
  });

export const enqueueMutation = (input: OfflineMutationInput): Promise<void> =>
  enqueueMutations([input]);

export const removeMutation = (id: string): Promise<void> =>
  withQueueLock(async () => {
    const queue = await getData<OfflineMutation>(KEYS.OFFLINE_QUEUE);
    const next = queue.filter((m) => m.id !== id);
    if (next.length === queue.length) return;
    await setData(KEYS.OFFLINE_QUEUE, next);
    notifyListeners(next.length);
  });

/** Bump retryCount for a queue entry; returns the new count (0 if gone). */
export const incrementRetry = (id: string): Promise<number> =>
  withQueueLock(async () => {
    const queue = await getData<OfflineMutation>(KEYS.OFFLINE_QUEUE);
    let retryCount = 0;
    const next = queue.map((m) => {
      if (m.id !== id) return m;
      retryCount = m.retryCount + 1;
      return { ...m, retryCount };
    });
    await setData(KEYS.OFFLINE_QUEUE, next);
    return retryCount;
  });

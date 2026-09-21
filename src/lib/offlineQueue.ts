import { readData, setData, KEYS } from '@/lib/storage';
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
 * Durability is fail-closed in both directions, because for an offline mutation
 * this queue is the only durable copy:
 *
 * - a write that does not reach AsyncStorage throws rather than reporting success;
 * - a read that fails throws rather than reporting an empty queue. Every mutating
 *   operation here is read-modify-write, so treating a failed read as `[]` would
 *   persist an empty queue over pending writes — silently destroying them.
 */

const generateEntryId = (): string =>
  `om${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;

/** Backfill fields added after entries may already have been persisted. */
const normalizeEntry = (mutation: OfflineMutation): OfflineMutation => ({
  ...mutation,
  revision: mutation.revision ?? 0,
  ownerUid: mutation.ownerUid ?? null,
});

/** Raised when the queue could not be read, so callers never mistake a failed
 *  read for an empty queue. */
export class OfflineQueueUnavailableError extends Error {
  readonly reason: 'shape' | 'corrupt' | 'io';
  constructor(reason: 'shape' | 'corrupt' | 'io') {
    super(
      `Could not save offline: device storage is unavailable (${reason}). ` +
        `The change was not queued.`
    );
    this.name = 'OfflineQueueUnavailableError';
    this.reason = reason;
  }
}

const readQueue = async (): Promise<OfflineMutation[]> => {
  const result = await readData<OfflineMutation>(KEYS.OFFLINE_QUEUE);
  if (!result.ok) throw new OfflineQueueUnavailableError(result.reason);
  return result.data.map(normalizeEntry);
};

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

/**
 * Last length we actually observed. A failed read must not clear the pending-
 * changes badge — reporting 0 would tell the user their writes are synced when
 * we simply could not look.
 */
let lastKnownCount = 0;

type QueueCountListener = (count: number) => void;

const listeners = new Set<QueueCountListener>();

const notifyListeners = (count: number): void => {
  lastKnownCount = count;
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

export const getQueueLength = async (): Promise<number> => {
  try {
    const count = (await readQueue()).length;
    lastKnownCount = count;
    return count;
  } catch (e) {
    logger.warn('Offline queue length unavailable, reporting last known count', e as Error);
    return lastKnownCount;
  }
};

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
 * Cap on the dead-letter store. Old entries are evicted first: a mutation that
 * has been undeliverable for that many failures is unlikely to be recovered,
 * and the store must not grow without bound on a persistently failing device.
 */
const MAX_DEAD_LETTERS = 50;

/** A mutation that was given up on, kept so it is not simply gone. */
export interface DeadLetter {
  mutation: OfflineMutation;
  reason: string;
  deadLetteredAt: number;
}

/**
 * Park a mutation that replay has given up on.
 *
 * Deleting it outright is what used to happen, which meant a user's edit
 * disappeared with only a `logger.warn` — and the logger is disabled outside
 * development. Parking it keeps the write recoverable and inspectable.
 *
 * Never throws: this runs on the failure path, and losing the dead letter must
 * not also abort the flush that was cleaning up after the failure.
 */
export const deadLetterMutation = async (
  mutation: OfflineMutation,
  reason: string
): Promise<boolean> => {
  try {
    const existing = await readData<DeadLetter>(KEYS.OFFLINE_DEAD_LETTER);
    const current = existing.ok ? existing.data : [];
    const next = [...current, { mutation, reason, deadLetteredAt: Date.now() }].slice(
      -MAX_DEAD_LETTERS
    );
    return await setData(KEYS.OFFLINE_DEAD_LETTER, next);
  } catch (e) {
    logger.warn('Offline queue: could not dead-letter mutation', e as Error);
    return false;
  }
};

/** Read the parked mutations, for surfacing or manual recovery. */
export const getDeadLetters = async (): Promise<DeadLetter[]> => {
  const result = await readData<DeadLetter>(KEYS.OFFLINE_DEAD_LETTER);
  return result.ok ? result.data : [];
};

/** Discard the parked mutations. */
export const clearDeadLetters = async (): Promise<void> => {
  await setData(KEYS.OFFLINE_DEAD_LETTER, []);
};

/**
 * Drop every queued mutation. Used only when the user explicitly chooses to
 * discard pending writes (Settings → clear cache).
 */
export const clearQueue = (): Promise<void> =>
  withQueueLock(async () => {
    await persistQueue([]);
    notifyListeners(0);
  });

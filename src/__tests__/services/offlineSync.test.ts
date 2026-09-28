/**
 * Tests flush mechanics with an injected executor and an in-memory stand-in
 * for the app's storage wrapper. The Firestore SDK itself is never mocked
 * (per project rules) — the default executor is simply not exercised here.
 */

import { flushOfflineQueue } from '@/services/offlineSync';
import { enqueueMutations, getQueue, setQueueOwner, getDeadLetters } from '@/lib/offlineQueue';
import { invalidateAll } from '@/lib/dataCache';
import type { OfflineMutation, OfflineMutationInput } from '@/types/offline.types';

const mockMemoryStore = new Map<string, unknown[]>();
const mockSafeSetItem = jest.fn(async (_key: string, _value: string) => true);

/**
 * `logError` forwards to errorTracker, which dynamically imports the Sentry
 * native module — unparseable under Jest. The real error helpers are kept so
 * the not-found / offline discrimination still runs against production code.
 */
const mockLogError = jest.fn();
jest.mock('@/utils/errorLogging', () => ({
  ...jest.requireActual('@/utils/errorLogging'),
  logError: (...args: unknown[]) => mockLogError(...args),
}));

jest.mock('@/lib/storage', () => ({
  KEYS: {
    OFFLINE_QUEUE: '@garden_offline_queue',
    OFFLINE_DEAD_LETTER: '@garden_offline_dead_letter',
    LAST_SYNC: '@garden_last_sync',
  },
  readData: jest.fn(async (key: string) => ({
    ok: true,
    data: mockMemoryStore.get(key) ?? [],
  })),
  getData: jest.fn(async (key: string) => mockMemoryStore.get(key) ?? []),
  setData: jest.fn(async (key: string, value: unknown[]) => {
    mockMemoryStore.set(key, value);
    return true;
  }),
}));

jest.mock('@/utils/safeStorage', () => ({
  safeGetItem: jest.fn(async () => null),
  safeSetItem: (key: string, value: string) => mockSafeSetItem(key, value),
}));

jest.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: { uid: 'test-user' } },
  refreshAuthToken: jest.fn(async () => true),
}));

jest.mock('@/lib/dataCache', () => ({
  invalidateAll: jest.fn(),
}));

// firestoreTimeout transitively imports NetInfo (native module) — stub the
// wrapper; the injected executors below never touch Firestore anyway.
jest.mock('@/utils/firestoreTimeout', () => ({
  withTimeoutAndRetry: jest.fn(async <T>(op: () => Promise<T>) => op()),
  FIRESTORE_WRITE_TIMEOUT_MS: 15000,
}));

const input = (overrides: Partial<OfflineMutationInput> = {}): OfflineMutationInput => ({
  collection: 'plants',
  docId: `doc-${Math.random().toString(36).slice(2, 8)}`,
  op: 'create',
  payload: { name: 'Tomato' },
  ...overrides,
});

const firestoreError = (code: string): Error => {
  const error = new Error(`firestore error: ${code}`) as Error & { code: string };
  error.code = code;
  return error;
};

beforeEach(() => {
  mockMemoryStore.clear();
  jest.clearAllMocks();
  setQueueOwner('test-user'); // matches the mocked auth.currentUser
});

describe('flushOfflineQueue', () => {
  it('replays all mutations FIFO, clears the queue, and stamps last sync', async () => {
    await enqueueMutations([input({ docId: 'a' }), input({ docId: 'b' }), input({ docId: 'c' })]);

    const replayed: string[] = [];
    const result = await flushOfflineQueue(async (m: OfflineMutation) => {
      replayed.push(m.docId);
    });

    expect(replayed).toEqual(['a', 'b', 'c']);
    expect(result).toEqual({ synced: 3, dropped: 0, remaining: 0, skipped: 0 });
    expect(await getQueue()).toHaveLength(0);
    expect(invalidateAll).toHaveBeenCalled();
    expect(mockSafeSetItem).toHaveBeenCalledWith('@garden_last_sync', expect.any(String));
  });

  it('stops the flush when the device goes offline mid-replay', async () => {
    await enqueueMutations([input({ docId: 'a' }), input({ docId: 'b' })]);

    const result = await flushOfflineQueue(async (m: OfflineMutation) => {
      if (m.docId === 'b') throw new Error('No network connection available');
    });

    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(1);
    const queue = await getQueue();
    expect(queue[0]!.docId).toBe('b');
    expect(queue[0]!.retryCount).toBe(0); // offline pause is not a retry strike
  });

  it('drops not-found updates/deletes and continues', async () => {
    await enqueueMutations([
      input({ docId: 'gone', op: 'update', payload: { name: 'x' } }),
      input({ docId: 'kept' }),
    ]);

    const result = await flushOfflineQueue(async (m: OfflineMutation) => {
      if (m.docId === 'gone') throw firestoreError('not-found');
    });

    expect(result).toEqual({ synced: 1, dropped: 1, remaining: 0, skipped: 0 });
  });

  it('pauses on other errors and drops the entry after MAX_RETRIES flushes', async () => {
    await enqueueMutations([input({ docId: 'poison' }), input({ docId: 'after' })]);

    const failingExecutor = async (m: OfflineMutation): Promise<void> => {
      if (m.docId === 'poison') throw firestoreError('internal');
    };

    // Four failing flushes: entry accumulates retries and blocks the queue
    for (let i = 1; i <= 4; i++) {
      const result = await flushOfflineQueue(failingExecutor);
      expect(result.synced).toBe(0);
      expect((await getQueue())[0]!.retryCount).toBe(i);
    }

    // Fifth failure hits MAX_RETRIES: poison dropped, rest of the queue syncs
    const final = await flushOfflineQueue(failingExecutor);
    expect(final.dropped).toBe(1);
    expect(final.synced).toBe(1);
    expect(final.remaining).toBe(0);
  });

  it('parks a given-up mutation in the dead-letter store instead of deleting it', async () => {
    await enqueueMutations([input({ docId: 'poison', payload: { name: 'Brinjal' } })]);

    const failingExecutor = async (): Promise<void> => {
      throw firestoreError('internal');
    };

    for (let i = 1; i <= 5; i++) await flushOfflineQueue(failingExecutor);

    expect(await getQueue()).toHaveLength(0);

    // The user's edit is gone from the queue but not gone from the device.
    const parked = await getDeadLetters();
    expect(parked).toHaveLength(1);
    expect(parked[0]!.mutation.docId).toBe('poison');
    expect(parked[0]!.mutation.payload).toEqual({ name: 'Brinjal' });
    expect(parked[0]!.reason).toMatch(/failed replay attempts/);
    expect(typeof parked[0]!.deadLetteredAt).toBe('number');

    // Reported through logError (which reaches Sentry) rather than the
    // development-only logger.
    expect(mockLogError).toHaveBeenCalledWith(
      'storage',
      expect.stringContaining('gave up'),
      expect.anything(),
      expect.objectContaining({ collection: 'plants', deadLettered: true })
    );
  });

  it('does not dead-letter a not-found drop, which is a legitimate no-op', async () => {
    await enqueueMutations([input({ docId: 'gone', op: 'update' })]);

    const notFoundExecutor = async (): Promise<void> => {
      throw firestoreError('not-found');
    };

    const result = await flushOfflineQueue(notFoundExecutor);

    expect(result.dropped).toBe(1);
    // The document no longer exists, so there is nothing to recover.
    expect(await getDeadLetters()).toHaveLength(0);
  });

  it('shares a single flush across concurrent calls', async () => {
    await enqueueMutations([input({ docId: 'a' })]);

    let executions = 0;
    const slowExecutor = async (): Promise<void> => {
      executions += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
    };

    const [first, second] = await Promise.all([
      flushOfflineQueue(slowExecutor),
      flushOfflineQueue(slowExecutor),
    ]);

    expect(executions).toBe(1);
    expect(first).toEqual(second);
  });

  it('is a no-op with an empty queue', async () => {
    const executor = jest.fn();
    const result = await flushOfflineQueue(executor);
    expect(result).toEqual({ synced: 0, dropped: 0, remaining: 0, skipped: 0 });
    expect(executor).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
  });

  it('keeps an edit that lands while its entry is being replayed', async () => {
    await enqueueMutations([input({ docId: 'a', payload: { name: 'Tomato' } })]);

    // The executor stands in for a slow Firestore write: the user edits the
    // same document before it returns, coalescing into the in-flight entry.
    const result = await flushOfflineQueue(async () => {
      await enqueueMutations([
        input({ docId: 'a', op: 'update', payload: { name: 'Roma Tomato' } }),
      ]);
    });

    // The original write did reach the server, so it counts as synced — but the
    // entry must stay queued carrying the newer edit rather than being removed.
    expect(result.synced).toBe(1);
    expect(result.remaining).toBe(1);
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]!.payload).toEqual({ name: 'Roma Tomato' });
  });

  it('skips (does not drop) mutations queued by a different account', async () => {
    setQueueOwner('other-user');
    await enqueueMutations([input({ docId: 'theirs' })]);
    setQueueOwner('test-user');
    await enqueueMutations([input({ docId: 'mine' })]);

    const replayed: string[] = [];
    const result = await flushOfflineQueue(async (m: OfflineMutation) => {
      replayed.push(m.docId);
    });

    expect(replayed).toEqual(['mine']);
    expect(result.skipped).toBe(1);
    expect(result.dropped).toBe(0);
    expect((await getQueue())[0]!.docId).toBe('theirs');
  });

  it('replays legacy entries that predate account tagging', async () => {
    setQueueOwner(null);
    await enqueueMutations([input({ docId: 'legacy' })]);

    const result = await flushOfflineQueue(async () => undefined);
    expect(result.synced).toBe(1);
    expect(result.skipped).toBe(0);
  });
});

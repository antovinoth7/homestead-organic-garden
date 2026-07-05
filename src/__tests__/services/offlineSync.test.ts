/**
 * Tests flush mechanics with an injected executor and an in-memory stand-in
 * for the app's storage wrapper. The Firestore SDK itself is never mocked
 * (per project rules) — the default executor is simply not exercised here.
 */

import { flushOfflineQueue } from '@/services/offlineSync';
import { enqueueMutations, getQueue } from '@/lib/offlineQueue';
import { invalidateAll } from '@/lib/dataCache';
import type { OfflineMutation, OfflineMutationInput } from '@/types/offline.types';

const mockMemoryStore = new Map<string, unknown[]>();
const mockSafeSetItem = jest.fn(async (_key: string, _value: string) => true);

jest.mock('@/lib/storage', () => ({
  KEYS: { OFFLINE_QUEUE: '@garden_offline_queue', LAST_SYNC: '@garden_last_sync' },
  getData: jest.fn(async (key: string) => mockMemoryStore.get(key) ?? []),
  setData: jest.fn(async (key: string, value: unknown[]) => {
    mockMemoryStore.set(key, value);
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
});

describe('flushOfflineQueue', () => {
  it('replays all mutations FIFO, clears the queue, and stamps last sync', async () => {
    await enqueueMutations([input({ docId: 'a' }), input({ docId: 'b' }), input({ docId: 'c' })]);

    const replayed: string[] = [];
    const result = await flushOfflineQueue(async (m: OfflineMutation) => {
      replayed.push(m.docId);
    });

    expect(replayed).toEqual(['a', 'b', 'c']);
    expect(result).toEqual({ synced: 3, dropped: 0, remaining: 0 });
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

    expect(result).toEqual({ synced: 1, dropped: 1, remaining: 0 });
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
    expect(result).toEqual({ synced: 0, dropped: 0, remaining: 0 });
    expect(executor).not.toHaveBeenCalled();
    expect(invalidateAll).not.toHaveBeenCalled();
  });
});

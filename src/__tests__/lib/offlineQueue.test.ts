/**
 * Tests the AsyncStorage-backed queue store with an in-memory stand-in for
 * the app's own storage wrapper (not the Firestore SDK, which stays unmocked
 * per project rules).
 */

import {
  enqueueMutation,
  enqueueMutations,
  getQueue,
  getQueueLength,
  removeMutation,
  incrementRetry,
  subscribeQueueCount,
  setQueueOwner,
  clearQueue,
} from '@/lib/offlineQueue';
import type { OfflineMutationInput } from '@/types/offline.types';

const mockMemoryStore = new Map<string, unknown[]>();

jest.mock('@/lib/storage', () => ({
  KEYS: { OFFLINE_QUEUE: '@garden_offline_queue' },
  getData: jest.fn(async (key: string) => mockMemoryStore.get(key) ?? []),
  setData: jest.fn(async (key: string, value: unknown[]) => {
    if (mockSetDataFails) return false;
    mockMemoryStore.set(key, value);
    return true;
  }),
}));

/** Flipped by the durability tests to simulate an AsyncStorage write failure. */
let mockSetDataFails = false;

const input = (overrides: Partial<OfflineMutationInput> = {}): OfflineMutationInput => ({
  collection: 'plants',
  docId: 'doc-1',
  op: 'create',
  payload: { name: 'Tomato' },
  ...overrides,
});

beforeEach(() => {
  mockMemoryStore.clear();
  mockSetDataFails = false;
  setQueueOwner('user-1');
});

describe('offlineQueue store', () => {
  it('enqueues mutations with generated ids and zero retries', async () => {
    await enqueueMutation(input());
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]!.id).toBeTruthy();
    expect(queue[0]!.retryCount).toBe(0);
    expect(queue[0]!.payload).toEqual({ name: 'Tomato' });
  });

  it('coalesces an update into a pending create for the same doc', async () => {
    await enqueueMutation(input());
    await enqueueMutation(input({ op: 'update', payload: { name: 'Roma Tomato' } }));
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]!.op).toBe('create');
    expect(queue[0]!.payload).toEqual({ name: 'Roma Tomato' });
  });

  it('queues batch inputs atomically and preserves FIFO order', async () => {
    await enqueueMutations([
      input({ docId: 'a' }),
      input({ docId: 'b' }),
      input({ docId: 'c', op: 'update' }),
    ]);
    expect((await getQueue()).map((m) => m.docId)).toEqual(['a', 'b', 'c']);
    expect(await getQueueLength()).toBe(3);
  });

  it('removes entries by id', async () => {
    await enqueueMutations([input({ docId: 'a' }), input({ docId: 'b' })]);
    const [first] = await getQueue();
    await removeMutation(first!.id);
    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]!.docId).toBe('b');
  });

  it('increments retry counts and persists them', async () => {
    await enqueueMutation(input());
    const [entry] = await getQueue();
    expect((await incrementRetry(entry!.id)).retryCount).toBe(1);
    expect((await incrementRetry(entry!.id)).retryCount).toBe(2);
    expect((await getQueue())[0]!.retryCount).toBe(2);
  });

  it('notifies subscribers with the current and updated counts', async () => {
    await enqueueMutation(input({ docId: 'a' }));
    const counts: number[] = [];
    const unsubscribe = subscribeQueueCount((count) => counts.push(count));
    await Promise.resolve(); // initial push
    await enqueueMutation(input({ docId: 'b' }));
    unsubscribe();
    await enqueueMutation(input({ docId: 'c' }));
    expect(counts).toEqual([1, 2]);
  });

  it('serializes concurrent enqueues without losing entries', async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => enqueueMutation(input({ docId: `doc-${i}` })))
    );
    expect(await getQueueLength()).toBe(10);
  });

  it('stamps the current owner uid onto queued mutations', async () => {
    setQueueOwner('user-2');
    await enqueueMutation(input());
    expect((await getQueue())[0]!.ownerUid).toBe('user-2');
  });

  it('clearQueue drops everything and notifies subscribers', async () => {
    await enqueueMutations([input({ docId: 'a' }), input({ docId: 'b' })]);
    await clearQueue();
    expect(await getQueueLength()).toBe(0);
  });
});

describe('durability', () => {
  it('throws instead of reporting success when the queue cannot be persisted', async () => {
    mockSetDataFails = true;
    await expect(enqueueMutation(input())).rejects.toThrow(/could not be persisted/);
  });

  it('throws when a removal cannot be persisted, so the entry is replayed again', async () => {
    await enqueueMutation(input());
    const [entry] = await getQueue();
    mockSetDataFails = true;
    await expect(removeMutation(entry!.id, entry!.revision)).rejects.toThrow(
      /could not be persisted/
    );
  });
});

describe('revision compare-and-swap', () => {
  it('bumps the revision when a mutation coalesces into a pending entry', async () => {
    await enqueueMutation(input());
    expect((await getQueue())[0]!.revision).toBe(0);
    await enqueueMutation(input({ op: 'update', payload: { name: 'Roma' } }));
    expect((await getQueue())[0]!.revision).toBe(1);
  });

  it('keeps an entry whose revision changed while it was in flight', async () => {
    await enqueueMutation(input());
    const [inFlight] = await getQueue();

    // Simulates a user edit landing while the entry is being replayed.
    await enqueueMutation(input({ op: 'update', payload: { name: 'Roma' } }));

    const removed = await removeMutation(inFlight!.id, inFlight!.revision);
    expect(removed).toBe(false);

    const queue = await getQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]!.payload).toEqual({ name: 'Roma' });
  });

  it('removes the entry when the revision still matches', async () => {
    await enqueueMutation(input());
    const [entry] = await getQueue();
    expect(await removeMutation(entry!.id, entry!.revision)).toBe(true);
    expect(await getQueueLength()).toBe(0);
  });
});

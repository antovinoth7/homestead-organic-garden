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
} from '@/lib/offlineQueue';
import type { OfflineMutationInput } from '@/types/offline.types';

const mockMemoryStore = new Map<string, unknown[]>();

jest.mock('@/lib/storage', () => ({
  KEYS: { OFFLINE_QUEUE: '@garden_offline_queue' },
  getData: jest.fn(async (key: string) => mockMemoryStore.get(key) ?? []),
  setData: jest.fn(async (key: string, value: unknown[]) => {
    mockMemoryStore.set(key, value);
  }),
}));

const input = (overrides: Partial<OfflineMutationInput> = {}): OfflineMutationInput => ({
  collection: 'plants',
  docId: 'doc-1',
  op: 'create',
  payload: { name: 'Tomato' },
  ...overrides,
});

beforeEach(() => {
  mockMemoryStore.clear();
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
    expect(await incrementRetry(entry!.id)).toBe(1);
    expect(await incrementRetry(entry!.id)).toBe(2);
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
});

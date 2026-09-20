import {
  coalesceQueue,
  encodeTimestamps,
  decodeTimestamps,
  isEncodedTimestamp,
} from '@/utils/offlineQueueLogic';
import type { OfflineMutation, OfflineMutationOp } from '@/types/offline.types';

const makeMutation = (overrides: Partial<OfflineMutation> = {}): OfflineMutation => ({
  id: `id-${Math.random().toString(36).slice(2, 8)}`,
  collection: 'plants',
  docId: 'doc-1',
  op: 'update' as OfflineMutationOp,
  payload: { name: 'Tomato' },
  createdAt: 1000,
  retryCount: 0,
  revision: 0,
  ownerUid: 'user-1',
  ...overrides,
});

describe('coalesceQueue', () => {
  it('appends mutations for distinct documents in FIFO order', () => {
    const a = makeMutation({ docId: 'a', op: 'create' });
    const b = makeMutation({ docId: 'b', op: 'update' });
    const queue = coalesceQueue(coalesceQueue([], a), b);
    expect(queue.map((m) => m.docId)).toEqual(['a', 'b']);
  });

  it('merges create + update into a single create with combined payload', () => {
    const create = makeMutation({ op: 'create', payload: { name: 'Tomato', health: 'healthy' } });
    const update = makeMutation({ op: 'update', payload: { health: 'stressed' } });
    const queue = coalesceQueue([create], update);
    expect(queue).toHaveLength(1);
    expect(queue[0]!.op).toBe('create');
    expect(queue[0]!.payload).toEqual({ name: 'Tomato', health: 'stressed' });
  });

  it('merges update + update, later fields winning', () => {
    const first = makeMutation({ op: 'update', payload: { a: 1, b: 1 } });
    const second = makeMutation({ op: 'update', payload: { b: 2, c: 3 } });
    const queue = coalesceQueue([first], second);
    expect(queue).toHaveLength(1);
    expect(queue[0]!.op).toBe('update');
    expect(queue[0]!.payload).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('promotes update + set to a set (replayed with merge)', () => {
    const update = makeMutation({ op: 'update', payload: { a: 1 } });
    const set = makeMutation({ op: 'set', payload: { b: 2 } });
    const queue = coalesceQueue([update], set);
    expect(queue[0]!.op).toBe('set');
    expect(queue[0]!.payload).toEqual({ a: 1, b: 2 });
  });

  it('drops both entries for create + delete (doc never existed remotely)', () => {
    const create = makeMutation({ op: 'create' });
    const del = makeMutation({ op: 'delete', payload: null });
    expect(coalesceQueue([create], del)).toHaveLength(0);
  });

  it('collapses update + delete into a single delete keeping queue position', () => {
    const other = makeMutation({ docId: 'other', op: 'update' });
    const update = makeMutation({ op: 'update' });
    const del = makeMutation({ op: 'delete', payload: null });
    const queue = coalesceQueue([update, other], del);
    expect(queue).toHaveLength(2);
    expect(queue[0]!.op).toBe('delete');
    expect(queue[0]!.docId).toBe('doc-1');
    expect(queue[0]!.id).toBe(update.id);
    expect(queue[1]!.docId).toBe('other');
  });

  it('appends after a pending delete instead of merging', () => {
    const del = makeMutation({ op: 'delete', payload: null });
    const recreate = makeMutation({ op: 'create' });
    const queue = coalesceQueue([del], recreate);
    expect(queue.map((m) => m.op)).toEqual(['delete', 'create']);
  });

  it('does not merge across collections sharing a docId', () => {
    const plant = makeMutation({ collection: 'plants', op: 'update' });
    const task = makeMutation({ collection: 'tasks', op: 'update' });
    expect(coalesceQueue([plant], task)).toHaveLength(2);
  });
});

describe('timestamp encoding', () => {
  const timestampLike = (date: Date): { toDate: () => Date; toMillis: () => number } => ({
    toDate: () => date,
    toMillis: () => date.getTime(),
  });

  it('round-trips Timestamp-like values nested in payloads', () => {
    const date = new Date('2026-07-01T10:00:00.000Z');
    const encoded = encodeTimestamps({
      name: 'Tomato',
      created_at: timestampLike(date),
      history: [{ logged_at: timestampLike(date), note: 'ok' }],
    }) as Record<string, unknown>;

    expect(isEncodedTimestamp(encoded.created_at)).toBe(true);
    expect(JSON.parse(JSON.stringify(encoded))).toEqual(encoded);

    const decoded = decodeTimestamps(encoded, (d) => d) as {
      name: string;
      created_at: Date;
      history: { logged_at: Date; note: string }[];
    };
    expect(decoded.name).toBe('Tomato');
    expect(decoded.created_at.toISOString()).toBe(date.toISOString());
    expect(decoded.history[0]!.logged_at.toISOString()).toBe(date.toISOString());
    expect(decoded.history[0]!.note).toBe('ok');
  });

  it('encodes plain Dates and leaves primitives and nulls untouched', () => {
    const date = new Date('2026-07-01T10:00:00.000Z');
    const encoded = encodeTimestamps({ when: date, count: 3, note: null }) as Record<
      string,
      unknown
    >;
    expect(isEncodedTimestamp(encoded.when)).toBe(true);
    expect(encoded.count).toBe(3);
    expect(encoded.note).toBeNull();
  });
});

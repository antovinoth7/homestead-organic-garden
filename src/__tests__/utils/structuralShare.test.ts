import { isJsonEqual, reuseIfSameItems, reuseUnchanged } from '@/utils/structuralShare';
import { makePlant } from '../fixtures/plant.fixtures';

/** A stand-in for a Firestore Timestamp — same shape, no SDK import. */
class FakeTimestamp {
  constructor(
    public seconds: number,
    public nanoseconds: number
  ) {}
  toMillis(): number {
    return this.seconds * 1000 + this.nanoseconds / 1e6;
  }
}

describe('isJsonEqual', () => {
  it('compares primitives, arrays and nested plain objects by value', () => {
    expect(isJsonEqual(1, 1)).toBe(true);
    expect(isJsonEqual('a', 'b')).toBe(false);
    expect(isJsonEqual(null, null)).toBe(true);
    expect(isJsonEqual(null, undefined)).toBe(false);
    expect(isJsonEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(
      isJsonEqual(
        { a: 1, nested: { list: [1, { b: 'x' }] } },
        { a: 1, nested: { list: [1, { b: 'x' }] } }
      )
    ).toBe(true);
    expect(isJsonEqual({ list: [1, 2] }, { list: [2, 1] })).toBe(false);
    expect(isJsonEqual([1], { 0: 1 })).toBe(false);
  });

  it('ignores key order but not missing keys', () => {
    expect(isJsonEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    expect(isJsonEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    // Conservative: an explicit undefined is not the same as no key.
    expect(isJsonEqual({ a: undefined }, {})).toBe(false);
  });

  it('compares Dates by time, never as empty objects', () => {
    expect(isJsonEqual(new Date(5), new Date(5))).toBe(true);
    expect(isJsonEqual(new Date(5), new Date(6))).toBe(false);
    expect(isJsonEqual(new Date(5), {})).toBe(false);
  });

  it('compares Timestamp-shaped values by seconds and nanoseconds', () => {
    expect(isJsonEqual(new FakeTimestamp(10, 5), new FakeTimestamp(10, 5))).toBe(true);
    expect(isJsonEqual(new FakeTimestamp(10, 5), new FakeTimestamp(10, 6))).toBe(false);
    expect(isJsonEqual({ at: new FakeTimestamp(1, 0) }, { at: new FakeTimestamp(1, 0) })).toBe(
      true
    );
  });

  it('treats other class instances as equal only to themselves', () => {
    const map = new Map([['a', 1]]);
    expect(isJsonEqual(map, map)).toBe(true);
    expect(isJsonEqual(new Map([['a', 1]]), new Map([['a', 2]]))).toBe(false);
    expect(isJsonEqual(new Map(), new Map())).toBe(false);
  });
});

describe('reuseUnchanged', () => {
  const tomato = makePlant({ id: 'p1', name: 'Tomato', pest_disease_history: [] });
  const okra = makePlant({ id: 'p2', name: 'Okra' });

  it('returns next as-is when there is nothing to reuse', () => {
    const next = [okra];
    expect(reuseUnchanged(null, next)).toBe(next);
    expect(reuseUnchanged([], next)).toBe(next);
  });

  it('returns the previous array when a refetch found the same data', () => {
    const prev = [tomato, okra];
    const refetched = [
      { ...tomato, pest_disease_history: [] },
      { ...okra },
    ];
    expect(reuseUnchanged(prev, refetched)).toBe(prev);
  });

  it('keeps unchanged objects and swaps in only the edited one', () => {
    const prev = [tomato, okra];
    const edited = { ...okra, health_status: 'sick' as const };
    const result = reuseUnchanged(prev, [{ ...tomato, pest_disease_history: [] }, edited]);
    expect(result).not.toBe(prev);
    expect(result[0]).toBe(tomato);
    expect(result[1]).toBe(edited);
  });

  it('builds a new array for a reorder while reusing every object', () => {
    const prev = [tomato, okra];
    const result = reuseUnchanged(prev, [{ ...okra }, { ...tomato, pest_disease_history: [] }]);
    expect(result).not.toBe(prev);
    expect(result[0]).toBe(okra);
    expect(result[1]).toBe(tomato);
  });

  it('handles added and removed entries', () => {
    const basil = makePlant({ id: 'p3', name: 'Basil' });
    const added = reuseUnchanged([tomato], [{ ...tomato, pest_disease_history: [] }, basil]);
    expect(added[0]).toBe(tomato);
    expect(added[1]).toBe(basil);

    const removed = reuseUnchanged([tomato, okra], [{ ...okra }]);
    expect(removed).toHaveLength(1);
    expect(removed[0]).toBe(okra);
  });

  it('notices a change deep inside a nested history', () => {
    const record = {
      id: 'h1',
      type: 'pest' as const,
      name: 'Aphids',
      occurredAt: '2026-01-02',
      resolved: false,
    };
    const withHistory = makePlant({ id: 'p4', pest_disease_history: [record] });
    const resolved = { ...withHistory, pest_disease_history: [{ ...record, resolved: true }] };
    const result = reuseUnchanged([withHistory], [resolved]);
    expect(result[0]).toBe(resolved);
  });
});

describe('reuseIfSameItems', () => {
  it('keeps the previous array when every element is the same object', () => {
    const a = { id: 'a' };
    const b = { id: 'b' };
    const prev = [a, b];
    expect(reuseIfSameItems(prev, [a, b])).toBe(prev);
  });

  it('takes the next array when any element differs or the length changes', () => {
    const a = { id: 'a' };
    const prev = [a];
    const next = [{ id: 'a' }];
    expect(reuseIfSameItems(prev, next)).toBe(next);
    const longer = [a, a];
    expect(reuseIfSameItems(prev, longer)).toBe(longer);
  });
});

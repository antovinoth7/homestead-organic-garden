/**
 * Structural sharing for re-fetched lists.
 *
 * Every Firestore refetch, AsyncStorage read or re-filter hands back brand-new
 * objects even when nothing changed. A `React.memo` row compares props by
 * reference, so new identities re-render every mounted row, and a `setState`
 * with a new-but-equal array re-runs every derived `useMemo` below it. That is
 * what made returning to the Plants tab stutter once its 30 s cache lapsed.
 *
 * `reuseUnchanged` keeps the previous object for every entry whose content is
 * the same, and the previous array itself when nothing at all changed — so an
 * unchanged refresh is a no-op render and one edited plant re-renders one card.
 *
 * Pure — no React, no services — so it is directly unit-testable.
 */

/** A Firestore `Timestamp`, recognised by shape so this file needs no SDK import. */
interface TimestampLike {
  seconds: number;
  nanoseconds: number;
  toMillis: () => number;
}

const isTimestampLike = (value: object): value is TimestampLike =>
  typeof (value as Partial<TimestampLike>).toMillis === 'function' &&
  typeof (value as Partial<TimestampLike>).seconds === 'number' &&
  typeof (value as Partial<TimestampLike>).nanoseconds === 'number';

const isPlainObject = (value: object): boolean => {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Deep equality for JSON-shaped data: primitives, plain objects and arrays are
 * compared structurally, `Date`s by time and Firestore Timestamps by value.
 * Anything else (class instances, Maps, references) is equal only to itself.
 *
 * Deliberately conservative: a false "different" only costs a re-render, while a
 * false "equal" would show stale data. One JSON rule is followed on purpose: an
 * object key holding `undefined` counts as absent, since every AsyncStorage
 * round-trip drops such keys and the two read the same.
 */
export function isJsonEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isJsonEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }

  if (isTimestampLike(a) || isTimestampLike(b)) {
    return (
      isTimestampLike(a) &&
      isTimestampLike(b) &&
      a.seconds === b.seconds &&
      a.nanoseconds === b.nanoseconds
    );
  }

  if (!isPlainObject(a) || !isPlainObject(b)) return false;

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = definedKeys(aRecord);
  if (aKeys.length !== definedKeys(bRecord).length) return false;
  // Same count of defined keys, and each of a's matches a defined value in b
  // (a missing or undefined one never equals a defined value) ⇒ same key set.
  for (const key of aKeys) {
    if (!isJsonEqual(aRecord[key], bRecord[key])) return false;
  }
  return true;
}

const definedKeys = (record: Record<string, unknown>): string[] =>
  Object.keys(record).filter((key) => record[key] !== undefined);

/**
 * `next`, but with each entry swapped for its `prev` counterpart (matched by
 * `id`) when the two are deep-equal. Returns `prev` itself when both hold the
 * same entries in the same order, so `setState(reuseUnchanged(prev, next))`
 * bails out of the render entirely.
 */
export function reuseUnchanged<T extends { id: string }>(
  prev: readonly T[] | null | undefined,
  next: T[]
): T[] {
  if (!prev || prev.length === 0) return next;

  const prevById = new Map<string, T>();
  for (const item of prev) prevById.set(item.id, item);

  let sameAsPrev = prev.length === next.length;
  const shared = next.map((item, index) => {
    const old = prevById.get(item.id);
    if (old !== undefined && (old === item || isJsonEqual(old, item))) {
      if (sameAsPrev && prev[index] !== old) sameAsPrev = false;
      return old;
    }
    sameAsPrev = false;
    return item;
  });

  return sameAsPrev ? (prev as T[]) : shared;
}

/**
 * `next` when any element differs by reference from `prev`, else `prev`. For
 * arrays rebuilt by filtering or sorting already-shared objects, where element
 * identity is all that can change.
 */
export function reuseIfSameItems<A extends readonly unknown[]>(prev: A, next: A): A {
  if (prev === next) return prev;
  if (prev.length !== next.length) return next;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) return next;
  }
  return prev;
}

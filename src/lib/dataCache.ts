/**
 * In-memory data freshness cache layer.
 *
 * Sits between screens and Firestore service calls.  When data is still
 * "fresh" (fetched less than `STALE_MS` ago), the cached result is
 * returned synchronously—avoiding redundant Firestore reads on every
 * tab switch.  Mutations call `invalidate()` so the next read goes to
 * the network.
 *
 * This does NOT replace AsyncStorage caching (offline fallback).  It
 * is a short-lived, in-memory-only layer to eliminate the "full reload
 * on every focus" bottleneck.
 */

const STALE_MS = 30_000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/* ── public helpers ─────────────────────────────────────── */

/**
 * Return cached data if it was fetched less than `STALE_MS` ago.
 * Returns `null` when stale or absent — caller should fetch fresh data.
 */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > STALE_MS) return null;
  return entry.data;
}

/**
 * Return cached data regardless of the 30s staleness window (still `null`
 * after `invalidate`). For callers that manage their own freshness policy
 * (e.g. the weather service's 3h window) or want stale-while-revalidate UI.
 */
export function peekCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  return entry ? entry.data : null;
}

/** Store freshly-fetched data. */
export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

/**
 * Epoch ms of the most recent invalidation per key. `dedup` compares against
 * it so a read that started before a mutation cannot write its pre-mutation
 * result back into the cache after the invalidation.
 */
const lastInvalidatedAt = new Map<string, number>();
/** Same, for prefix invalidations — keys created after the call must also lose. */
const invalidatedPrefixes = new Map<string, number>();
/** Same, for `invalidateAll` (e.g. sign-out). */
let invalidatedAllAt = 0;

/** Epoch ms of the newest invalidation affecting `key`, or 0 if never. */
function invalidatedSince(key: string): number {
  let latest = Math.max(invalidatedAllAt, lastInvalidatedAt.get(key) ?? 0);
  for (const [prefix, at] of invalidatedPrefixes) {
    if (at > latest && key.startsWith(prefix)) latest = at;
  }
  return latest;
}

/** Mark one or more keys as stale so the next read fetches fresh data. */
export function invalidate(...keys: string[]): void {
  const now = Date.now();
  for (const key of keys) {
    store.delete(key);
    pendingRequests.delete(key);
    lastInvalidatedAt.set(key, now);
  }
}

/**
 * Mark every key starting with `prefix` as stale. For families of dynamic,
 * per-entity keys (e.g. `taskLogs:plant:<id>`) that `invalidate` cannot
 * enumerate.
 */
export function invalidatePrefix(prefix: string): void {
  const now = Date.now();
  for (const key of Array.from(store.keys())) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of Array.from(pendingRequests.keys())) {
    if (key.startsWith(prefix)) pendingRequests.delete(key);
  }
  // Stamp in-flight keys too, so a fetch started before this call cannot
  // repopulate the prefix after it was cleared.
  for (const key of Array.from(lastInvalidatedAt.keys())) {
    if (key.startsWith(prefix)) lastInvalidatedAt.set(key, now);
  }
  invalidatedPrefixes.set(prefix, now);
}

/** Mark everything stale (e.g. on sign-out). */
export function invalidateAll(): void {
  store.clear();
  pendingRequests.clear();
  lastInvalidatedAt.clear();
  invalidatedPrefixes.clear();
  invalidatedAllAt = Date.now();
}

/* ── request deduplication ──────────────────────────────── */

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicate concurrent service calls for the same cache key.
 *
 * If a request for `key` is already in-flight, subsequent callers
 * receive the same promise instead of firing a duplicate Firestore
 * read.  The result is stored via `setCached()` on success.
 */
export function dedup<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const startTime = Date.now();
  const promise = fetcher()
    .then((result) => {
      // Don't repopulate the cache with a result that predates an invalidation
      // (e.g. a mutation committed while this fetch was in-flight) — that would
      // silently undo the invalidation and serve stale data for STALE_MS.
      if (invalidatedSince(key) > startTime) return result;

      // Don't overwrite a more-recent surgical cache update (e.g. from deletePlantsForBed)
      // that ran while this fetch was in-flight.
      const current = store.get(key);
      if (!current || current.fetchedAt <= startTime) {
        setCached(key, result);
      }
      return result;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
}

/* ── well-known cache keys ──────────────────────────────── */

export const CACHE_KEYS = {
  ALL_PLANTS: 'allPlants',
  TODAY_TASKS: 'todayTasks',
  TASK_TEMPLATES: 'taskTemplates',
  TASK_LOGS: 'taskLogs',
  TODAY_TASK_LOGS: 'todayTaskLogs',
  JOURNAL_ENTRIES: 'journalEntries',
  JOURNAL_METADATA: 'journalMetadata',
  BEDS: 'beds',
  LOCATIONS: 'locations',
  WEATHER: 'weather',
} as const;

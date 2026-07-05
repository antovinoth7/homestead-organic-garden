import type { OfflineMutation } from '@/types/offline.types';

/**
 * Pure helpers for the offline mutation queue.
 *
 * Kept free of Firestore and AsyncStorage imports so the coalescing and
 * serialization rules are unit-testable in isolation. Storage lives in
 * src/lib/offlineQueue.ts; replay lives in src/services/offlineSync.ts.
 */

/** JSON-safe stand-in for a Firestore Timestamp inside a queued payload. */
export interface EncodedTimestamp {
  __offlineType: 'timestamp';
  iso: string;
}

export const isEncodedTimestamp = (value: unknown): value is EncodedTimestamp =>
  typeof value === 'object' &&
  value !== null &&
  (value as EncodedTimestamp).__offlineType === 'timestamp' &&
  typeof (value as EncodedTimestamp).iso === 'string';

interface TimestampLike {
  toDate: () => Date;
  toMillis: () => number;
}

const isTimestampLike = (value: unknown): value is TimestampLike => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<TimestampLike>;
  return typeof candidate.toDate === 'function' && typeof candidate.toMillis === 'function';
};

/**
 * Recursively replace Firestore Timestamps (and Dates) with a JSON-safe
 * marker so the payload survives AsyncStorage round-trips. Reversed by
 * decodeTimestamps in offlineSync before replay.
 */
export const encodeTimestamps = (value: unknown): unknown => {
  if (isTimestampLike(value)) {
    return { __offlineType: 'timestamp', iso: value.toDate().toISOString() } as EncodedTimestamp;
  }
  if (value instanceof Date) {
    return { __offlineType: 'timestamp', iso: value.toISOString() } as EncodedTimestamp;
  }
  if (Array.isArray(value)) return value.map(encodeTimestamps);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, encodeTimestamps(entry)])
    );
  }
  return value;
};

/**
 * Recursively replace EncodedTimestamp markers using the provided factory
 * (the caller passes Timestamp.fromDate so this module stays Firestore-free).
 */
export const decodeTimestamps = (
  value: unknown,
  timestampFromDate: (date: Date) => unknown
): unknown => {
  if (isEncodedTimestamp(value)) return timestampFromDate(new Date(value.iso));
  if (Array.isArray(value)) return value.map((entry) => decodeTimestamps(entry, timestampFromDate));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, decodeTimestamps(entry, timestampFromDate)])
    );
  }
  return value;
};

/**
 * Add a mutation to the queue, coalescing per document so the queue holds at
 * most one pending entry per (collection, docId) in the common cases:
 * - create + update/set  → merged create
 * - update/set + update/set → merged update ('set' wins: replayed with merge)
 * - create + delete      → both dropped (doc never existed remotely)
 * - update/set + delete  → single delete
 * - delete + anything    → appended separately (replayed in FIFO order)
 */
export const coalesceQueue = (
  queue: OfflineMutation[],
  incoming: OfflineMutation
): OfflineMutation[] => {
  const index = queue.findIndex(
    (m) => m.collection === incoming.collection && m.docId === incoming.docId
  );
  if (index === -1) return [...queue, incoming];

  const existing = queue[index]!;

  if (existing.op === 'delete') {
    // Rare: doc deleted then re-created offline — keep both, FIFO handles it.
    return [...queue, incoming];
  }

  if (incoming.op === 'delete') {
    if (existing.op === 'create') {
      return queue.filter((_, i) => i !== index);
    }
    return queue.map((m, i) =>
      i === index ? { ...incoming, id: existing.id, createdAt: existing.createdAt } : m
    );
  }

  const op =
    existing.op === 'create'
      ? 'create'
      : existing.op === 'set' || incoming.op === 'set'
        ? 'set'
        : 'update';
  const payload = { ...(existing.payload ?? {}), ...(incoming.payload ?? {}) };

  return queue.map((m, i) => (i === index ? { ...existing, op, payload } : m));
};

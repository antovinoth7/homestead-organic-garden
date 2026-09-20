/**
 * Offline mutation queue types.
 *
 * When a Firestore write fails because the device is offline, the write is
 * recorded as an OfflineMutation in AsyncStorage (KEYS.OFFLINE_QUEUE) and
 * replayed in FIFO order once connectivity returns (see
 * src/services/offlineSync.ts).
 */

export type OfflineMutationOp = 'create' | 'update' | 'set' | 'delete';

export interface OfflineMutation {
  /** Unique id for this queue entry */
  id: string;
  /** Firestore collection name */
  collection: string;
  /** Document id (client-generated for creates so optimistic records match) */
  docId: string;
  /**
   * How to replay: 'create' → setDoc, 'update' → updateDoc,
   * 'set' → setDoc(..., { merge: true }), 'delete' → deleteDoc.
   */
  op: OfflineMutationOp;
  /** Document payload with Timestamps encoded for JSON storage; null for deletes */
  payload: Record<string, unknown> | null;
  /** Epoch ms when the mutation was first queued */
  createdAt: number;
  /** Number of failed replay attempts so far */
  retryCount: number;
  /**
   * Bumped every time a later mutation coalesces into this entry. Replay
   * removes an entry only when the stored revision still matches the one it
   * executed, so an edit made mid-flight is never deleted unsent.
   * Entries persisted before this field existed read back as 0.
   */
  revision: number;
  /**
   * uid of the account that queued the mutation. Replay skips entries owned by
   * a different account so a device shared between users never replays one
   * user's writes under another's session.
   */
  ownerUid: string | null;
}

export type OfflineMutationInput = Omit<
  OfflineMutation,
  'id' | 'createdAt' | 'retryCount' | 'revision' | 'ownerUid'
>;

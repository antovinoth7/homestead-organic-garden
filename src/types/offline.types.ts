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
}

export type OfflineMutationInput = Omit<OfflineMutation, 'id' | 'createdAt' | 'retryCount'>;

/**
 * The shared write path: when a write commits, when it is queued, and when it
 * must throw. The Firestore operation is passed in as a plain promise, so the
 * SDK is never mocked; the queue store is stubbed (its own suite covers it).
 */

import { isOfflineWriteError, writeOrQueue } from '@/lib/offlineWrite';
import { enqueueMutations, hasPendingMutationFor } from '@/lib/offlineQueue';
import type { OfflineMutationInput } from '@/types/offline.types';

jest.mock('@/utils/networkState', () => ({ isNetworkAvailable: jest.fn(() => true) }));
jest.mock('@/lib/offlineQueue', () => ({
  enqueueMutations: jest.fn(async () => undefined),
  hasPendingMutationFor: jest.fn(async () => false),
}));

const mockedEnqueue = enqueueMutations as jest.MockedFunction<typeof enqueueMutations>;
const mockedHasPending = hasPendingMutationFor as jest.MockedFunction<typeof hasPendingMutationFor>;

const input: OfflineMutationInput = {
  collection: 'plants',
  docId: 'plant-1',
  op: 'update',
  payload: { name: 'Brinjal' },
};

const firestoreError = (code: string): Error & { code: string } =>
  Object.assign(new Error(`firestore: ${code}`), { code });

/** A Firestore write on a stalled link: it never rejects, it just stays pending. */
const hang = (): Promise<never> => new Promise<never>(() => undefined);

beforeEach(() => {
  mockedEnqueue.mockClear();
  mockedHasPending.mockReset();
  mockedHasPending.mockResolvedValue(false);
});

describe('writeOrQueue', () => {
  it('commits directly when nothing for the doc is pending', async () => {
    const op = jest.fn(() => Promise.resolve());
    await expect(writeOrQueue(input, op)).resolves.toEqual({ queued: false });
    expect(op).toHaveBeenCalledTimes(1);
    expect(mockedEnqueue).not.toHaveBeenCalled();
  });

  it('queues a write that times out instead of reporting a failure', async () => {
    const op = jest.fn(hang);
    await expect(writeOrQueue(input, op, { timeoutMs: 5 })).resolves.toEqual({ queued: true });
    expect(mockedEnqueue).toHaveBeenCalledWith([input]);
  });

  it('sends a stalled write once rather than re-sending it on every retry', async () => {
    const op = jest.fn(hang);
    await writeOrQueue(input, op, { timeoutMs: 5 });
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('queues behind a pending mutation for the same doc without writing', async () => {
    mockedHasPending.mockResolvedValue(true);
    const op = jest.fn(() => Promise.resolve());
    await expect(writeOrQueue([input], op)).resolves.toEqual({ queued: true });
    expect(op).not.toHaveBeenCalled();
    expect(mockedHasPending).toHaveBeenCalledWith([input]);
    expect(mockedEnqueue).toHaveBeenCalledWith([input]);
  });

  it('throws a server refusal and never queues it', async () => {
    const op = jest.fn(() => Promise.reject(firestoreError('permission-denied')));
    await expect(writeOrQueue(input, op)).rejects.toMatchObject({ code: 'permission-denied' });
    expect(mockedEnqueue).not.toHaveBeenCalled();
  });
});

describe('isOfflineWriteError', () => {
  it.each(['unavailable', 'deadline-exceeded'])('treats %s as offline', (code) => {
    expect(isOfflineWriteError(firestoreError(code))).toBe(true);
  });

  it('treats the no-network short-circuit as offline', () => {
    expect(isOfflineWriteError(new Error('No network connection available'))).toBe(true);
  });

  it.each(['permission-denied', 'invalid-argument', 'not-found'])(
    'does not treat %s as offline',
    (code) => {
      expect(isOfflineWriteError(firestoreError(code))).toBe(false);
    }
  );
});

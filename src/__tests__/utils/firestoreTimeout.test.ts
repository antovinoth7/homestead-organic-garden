/**
 * Timeout and retry policy for Firestore calls. The wrapped operations are
 * plain promises — the helper never touches the SDK — so Firestore stays
 * unmocked; only the NetInfo-backed connectivity flag is stubbed.
 */

import {
  CACHED_READ_OPTIONS,
  FirestoreTimeoutError,
  FIRESTORE_READ_TIMEOUT_MS,
  NoNetworkError,
  withTimeoutAndRetry,
} from '@/utils/firestoreTimeout';
import { isNetworkAvailable } from '@/utils/networkState';

jest.mock('@/utils/networkState', () => ({ isNetworkAvailable: jest.fn(() => true) }));

const mockedIsNetworkAvailable = isNetworkAvailable as jest.MockedFunction<
  typeof isNetworkAvailable
>;

const firestoreError = (code: string): Error & { code: string } =>
  Object.assign(new Error(`firestore: ${code}`), { code });

/** An operation that never settles — what a write on a stalled link looks like. */
const hang = (): Promise<never> => new Promise<never>(() => undefined);

beforeEach(() => {
  mockedIsNetworkAvailable.mockReturnValue(true);
});

describe('withTimeoutAndRetry', () => {
  it.each(['failed-precondition', 'resource-exhausted', 'permission-denied', 'invalid-argument'])(
    'does not retry %s — a retry cannot fix it',
    async (code) => {
      const op = jest.fn(() => Promise.reject(firestoreError(code)));
      await expect(
        withTimeoutAndRetry(op, { maxRetries: 2, baseDelayMs: 1 })
      ).rejects.toMatchObject({ code });
      expect(op).toHaveBeenCalledTimes(1);
    }
  );

  it('still retries a transient error', async () => {
    const op = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(firestoreError('aborted'))
      .mockResolvedValueOnce('ok');
    await expect(withTimeoutAndRetry(op, { maxRetries: 2, baseDelayMs: 1 })).resolves.toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('raises a typed deadline-exceeded error on timeout', async () => {
    const error = await withTimeoutAndRetry(hang, { timeoutMs: 5, maxRetries: 0 }).catch(
      (e: unknown) => e
    );
    expect(error).toBeInstanceOf(FirestoreTimeoutError);
    expect(error).toMatchObject({ code: 'deadline-exceeded' });
  });

  it('retries a timeout by default', async () => {
    const op = jest.fn(hang);
    await expect(
      withTimeoutAndRetry(op, { timeoutMs: 5, maxRetries: 1, baseDelayMs: 1 })
    ).rejects.toBeInstanceOf(FirestoreTimeoutError);
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('sends the operation once when retryOnTimeout is false', async () => {
    const op = jest.fn(hang);
    await expect(
      withTimeoutAndRetry(op, {
        timeoutMs: 5,
        maxRetries: 2,
        baseDelayMs: 1,
        retryOnTimeout: false,
      })
    ).rejects.toBeInstanceOf(FirestoreTimeoutError);
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('rethrows the original error object for a non-retryable code', async () => {
    const error = firestoreError('permission-denied');
    const op = jest.fn(() => Promise.reject(error));
    await expect(withTimeoutAndRetry(op, { maxRetries: 2, baseDelayMs: 1 })).rejects.toBe(error);
  });

  it('rethrows the last error once every retry has failed', async () => {
    const first = firestoreError('aborted');
    const last = firestoreError('unavailable');
    const op = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(first)
      .mockRejectedValueOnce(firestoreError('aborted'))
      .mockRejectedValueOnce(last);
    await expect(withTimeoutAndRetry(op, { maxRetries: 2, baseDelayMs: 1 })).rejects.toBe(last);
    expect(op).toHaveBeenCalledTimes(3);
  });

  it('retries an error that carries no code', async () => {
    const op = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('Failed to fetch'))
      .mockResolvedValueOnce('ok');
    await expect(withTimeoutAndRetry(op, { maxRetries: 1, baseDelayMs: 1 })).resolves.toBe('ok');
    expect(op).toHaveBeenCalledTimes(2);
  });

  it('stops retrying when the network drops after a failed attempt', async () => {
    const op = jest.fn(() => {
      mockedIsNetworkAvailable.mockReturnValue(false);
      return Promise.reject(firestoreError('unavailable'));
    });
    await expect(withTimeoutAndRetry(op, { maxRetries: 3, baseDelayMs: 1 })).rejects.toThrow(
      'No network connection available'
    );
    expect(op).toHaveBeenCalledTimes(1);
  });

  it('keeps the failure it gave up on when the network drops', async () => {
    const original = firestoreError('unavailable');
    const op = jest.fn(() => {
      mockedIsNetworkAvailable.mockReturnValue(false);
      return Promise.reject(original);
    });
    const error: unknown = await withTimeoutAndRetry(op, { maxRetries: 3, baseDelayMs: 1 }).catch(
      (caught: unknown) => caught
    );
    expect(error).toBeInstanceOf(NoNetworkError);
    expect(error).toMatchObject({ code: 'unavailable', cause: original });
  });

  it('fails fast without a network, before running the operation', async () => {
    mockedIsNetworkAvailable.mockReturnValue(false);
    const op = jest.fn(() => Promise.resolve('never reached'));
    const error: unknown = await withTimeoutAndRetry(op).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NoNetworkError);
    expect(error).toMatchObject({
      message: 'No network connection available',
      code: 'unavailable',
    });
    expect(op).not.toHaveBeenCalled();
  });
});

describe('CACHED_READ_OPTIONS', () => {
  it('reaches the local fallback after a single read timeout', () => {
    expect(CACHED_READ_OPTIONS).toEqual({
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
      maxRetries: 1,
      retryOnTimeout: false,
    });
  });
});

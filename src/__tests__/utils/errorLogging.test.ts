/**
 * logError → errorTracker → Sentry severity routing. Connectivity failures on
 * the network path are the expected weak-link fallback (the service already
 * served the local copy), so they reach Sentry as warnings, not errors.
 * Sentry and AsyncStorage are stubbed; Firestore is never involved.
 */

import * as Sentry from '@sentry/react-native';
import { isConnectivityError, logError } from '@/utils/errorLogging';
import { FirestoreTimeoutError } from '@/utils/firestoreTimeout';

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(() => Promise.resolve()), removeItem: jest.fn() },
}));
jest.mock('@/utils/logger', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock('@/utils/networkState', () => ({ isNetworkAvailable: jest.fn(() => true) }));

const mockedCapture = Sentry.captureException as jest.MockedFunction<
  typeof Sentry.captureException
>;

const firestoreError = (code: string): Error & { code: string } =>
  Object.assign(new Error(`firestore: ${code}`), { code });

/** logError hops through two dynamic imports and an AsyncStorage write. */
const flush = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
};

interface CapturedContext {
  level: string;
  tags: Record<string, string>;
  contexts: { custom: Record<string, unknown> };
}

const lastCapture = (): CapturedContext => {
  expect(mockedCapture).toHaveBeenCalledTimes(1);
  return mockedCapture.mock.calls[0]?.[1] as unknown as CapturedContext;
};

beforeEach(() => {
  mockedCapture.mockClear();
});

describe('isConnectivityError', () => {
  it.each([
    ['a FirestoreTimeoutError', new FirestoreTimeoutError(10000)],
    ['Firestore deadline-exceeded', firestoreError('deadline-exceeded')],
    ['Firestore unavailable', firestoreError('unavailable')],
    ['the offline guard', new Error('No network connection available')],
  ])('is true for %s', (_label, error) => {
    expect(isConnectivityError(error)).toBe(true);
  });

  it.each([
    ['permission-denied', firestoreError('permission-denied')],
    ['failed-precondition', firestoreError('failed-precondition')],
    ['a plain Error', new Error('boom')],
    ['undefined', undefined],
    ['a string', 'No network'],
  ])('is false for %s', (_label, error) => {
    expect(isConnectivityError(error)).toBe(false);
  });
});

describe('logError Sentry level', () => {
  it('reports a network timeout as a warning with its call site', async () => {
    logError('network', 'Failed to fetch plants from Firestore', new FirestoreTimeoutError(10000));
    await flush();

    const ctx = lastCapture();
    expect(ctx.level).toBe('warning');
    expect(ctx.tags).toEqual({ source: 'error_tracker', type: 'network' });
    expect(ctx.contexts.custom.operation).toBe('Failed to fetch plants from Firestore');
  });

  it('reports Firestore unavailable on the network path as a warning', async () => {
    logError('network', 'getBeds failed', firestoreError('unavailable'));
    await flush();
    expect(lastCapture().level).toBe('warning');
  });

  it('reports the offline guard as a warning', async () => {
    logError('network', 'getBeds failed', new Error('No network connection available'));
    await flush();
    expect(lastCapture().level).toBe('warning');
  });

  it('keeps a non-connectivity network failure at error', async () => {
    logError('network', 'getBeds failed', firestoreError('permission-denied'));
    await flush();

    const ctx = lastCapture();
    expect(ctx.level).toBe('error');
    expect(ctx.contexts.custom.operation).toBe('getBeds failed');
  });

  it('only downgrades the network type', async () => {
    logError('storage', 'backup failed', new FirestoreTimeoutError(15000));
    await flush();
    expect(lastCapture().level).toBe('error');
  });
});

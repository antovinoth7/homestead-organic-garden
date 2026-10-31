/**
 * The token check that runs ahead of every service read. Firebase Auth is
 * replaced so the test controls the signed-in user; Firestore is initialised
 * for real (it makes no request until used) and never touched.
 */

import { isNetworkAvailable } from '@/utils/networkState';

type FirebaseModule = typeof import('@/lib/firebase');

const mockGetIdToken = jest.fn<Promise<string>, [boolean?]>();

jest.mock('@firebase/auth', () => ({
  initializeAuth: jest.fn(() => ({ currentUser: { getIdToken: mockGetIdToken } })),
  getAuth: jest.fn(() => ({ currentUser: { getIdToken: mockGetIdToken } })),
  getReactNativePersistence: jest.fn(() => ({})),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: {} }));
jest.mock('@/utils/networkState', () => ({ isNetworkAvailable: jest.fn(() => true) }));

const mockedIsNetworkAvailable = isNetworkAvailable as jest.MockedFunction<
  typeof isNetworkAvailable
>;

describe('refreshAuthToken', () => {
  let refreshAuthToken: FirebaseModule['refreshAuthToken'];
  let auth: FirebaseModule['auth'];

  // firebase.ts validates its env at import, so load it once the env is set.
  beforeAll(() => {
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY = 'test-key';
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = 'test.appspot.com';
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = '1';
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID = '1:1:web:1';
    ({ refreshAuthToken, auth } = jest.requireActual<FirebaseModule>('@/lib/firebase'));
  });

  // The module keeps its last-refresh and last-failure stamps across tests, so
  // each test starts two hours later: past the refresh interval and any backoff.
  let clock = Date.parse('2026-10-31T06:00:00.000Z');

  beforeEach(() => {
    clock += 2 * 60 * 60_000;
    jest.useFakeTimers({ now: clock });
    mockGetIdToken.mockReset();
    mockedIsNetworkAvailable.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('makes no token request while offline', async () => {
    mockedIsNetworkAvailable.mockReturnValue(false);
    await expect(refreshAuthToken()).resolves.toBe(false);
    expect(mockGetIdToken).not.toHaveBeenCalled();
  });

  it('backs off after a failure instead of retrying on every call', async () => {
    mockGetIdToken.mockRejectedValue(new Error('auth/network-request-failed'));
    await expect(refreshAuthToken()).resolves.toBe(false);
    expect(mockGetIdToken).toHaveBeenCalledTimes(1);

    // The next service calls in the same moment skip straight to their fallback.
    await expect(refreshAuthToken()).resolves.toBe(false);
    await expect(refreshAuthToken()).resolves.toBe(false);
    expect(mockGetIdToken).toHaveBeenCalledTimes(1);

    // Once the backoff lapses it tries again.
    jest.advanceTimersByTime(61_000);
    mockGetIdToken.mockResolvedValue('token');
    await expect(refreshAuthToken()).resolves.toBe(true);
    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
  });

  it('does not force a network refresh by default', async () => {
    mockGetIdToken.mockResolvedValue('token');
    await refreshAuthToken();
    expect(mockGetIdToken).toHaveBeenLastCalledWith(false);
  });

  it('forces one when asked, even with a fresh token', async () => {
    mockGetIdToken.mockResolvedValue('token');
    await refreshAuthToken();
    await refreshAuthToken(true);
    expect(mockGetIdToken).toHaveBeenCalledTimes(2);
    expect(mockGetIdToken).toHaveBeenLastCalledWith(true);
  });

  it('skips the request while the token is still fresh', async () => {
    mockGetIdToken.mockResolvedValue('token');
    await refreshAuthToken();
    jest.advanceTimersByTime(10 * 60_000);
    await expect(refreshAuthToken()).resolves.toBe(true);
    expect(mockGetIdToken).toHaveBeenCalledTimes(1);
  });

  it('returns false when nobody is signed in', async () => {
    const signedIn = auth.currentUser;
    Object.assign(auth, { currentUser: null });
    try {
      await expect(refreshAuthToken()).resolves.toBe(false);
      expect(mockGetIdToken).not.toHaveBeenCalled();
    } finally {
      Object.assign(auth, { currentUser: signedIn });
    }
  });
});

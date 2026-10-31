/**
 * Firebase Configuration
 *
 * This app uses Firebase for:
 * - Authentication (Firebase Auth)
 * - Text/structured data sync (Firestore) - FREE TIER ONLY
 *
 * What Firebase is NOT used for:
 * - Image storage (images are stored locally on device)
 * - Any paid features
 *
 * Firebase Firestore stores only text data and image filenames.
 * This keeps the app within free tier limits for 10-15+ years.
 */

import { initializeApp } from 'firebase/app';
import * as FirebaseAuth from '@firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { isNetworkAvailable } from '@/utils/networkState';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
  throw new Error('Missing Firebase environment values. Check EXPO_PUBLIC_FIREBASE_* variables.');
}

// Your Firebase configuration
// Get these from Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native AsyncStorage persistence
// CRITICAL: This ensures user sessions persist across app restarts in APK builds
// Without this, users would be logged out every time the app is closed
const getReactNativePersistence = (FirebaseAuth as Record<string, unknown>)
  .getReactNativePersistence as
  | ((storage: typeof ReactNativeAsyncStorage) => FirebaseAuth.Persistence)
  | undefined;

let auth: FirebaseAuth.Auth;
if (typeof getReactNativePersistence === 'function') {
  try {
    auth = FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (error: unknown) {
    if (
      error != null &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: unknown }).code === 'auth/already-initialized'
    ) {
      auth = FirebaseAuth.getAuth(app);
    } else {
      throw error;
    }
  }
} else {
  logger.warn(
    'Firebase RN persistence helper is unavailable; falling back to default auth initialization.'
  );
  auth = FirebaseAuth.getAuth(app);
}

// Initialize Firestore (text data only - no images!)
// Use in-memory cache to avoid persistent cache corruption warnings.
const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

// NOTE: Firebase Storage is NOT initialized because we don't use it
// Images are stored locally on the device to avoid any cloud storage costs

/**
 * REMOVED: clearFirestoreCache - terminating Firestore causes "client already terminated" errors
 * Memory cache is managed automatically by Firebase SDK
 * If memory issues arise, consider using persistentLocalCache instead of memoryLocalCache
 */

// Track last token refresh to avoid excessive refreshes
let lastTokenRefresh = 0;
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes (tokens expire in 60min)
// After a failed refresh, skip further attempts for a while. Without this every
// service call in a weak-signal session re-attempts the round trip and stalls on
// Firebase Auth's own HTTP timeout before its Firestore read can even start.
let lastRefreshFailure = 0;
const TOKEN_REFRESH_FAILURE_BACKOFF_MS = 60 * 1000;
let pendingRefresh: Promise<boolean> | null = null;

/**
 * Make sure the auth token is usable before a Firestore call.
 *
 * Not forced by default: `getIdToken()` returns the cached token and only goes
 * to the network when it is within 5 minutes of expiry, which is all the
 * Firestore SDK needs (it refreshes tokens itself as well). A forced refresh
 * cost a network round trip ahead of the first read of every session.
 *
 * Offline it returns immediately — the read it guards will fall back to
 * AsyncStorage, and waiting on a token request first only delays that.
 * Concurrent calls share the same in-flight promise.
 * @param forceRefresh - Force a network refresh even if recently refreshed
 * @returns true if the token is fresh or was refreshed successfully
 */
export const refreshAuthToken = async (forceRefresh = false): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    if (!isNetworkAvailable()) return false;

    const now = Date.now();
    // Only refresh if token is close to expiring (or force refresh)
    if (!forceRefresh && now - lastTokenRefresh < TOKEN_REFRESH_INTERVAL) {
      return true; // Token is still fresh
    }
    if (!forceRefresh && now - lastRefreshFailure < TOKEN_REFRESH_FAILURE_BACKOFF_MS) {
      return false; // Failed recently — let the caller proceed to its own fallback
    }

    // Deduplicate concurrent refresh calls
    if (pendingRefresh) return pendingRefresh;

    pendingRefresh = (async () => {
      try {
        await user.getIdToken(forceRefresh);
        lastTokenRefresh = Date.now();
        lastRefreshFailure = 0;
        return true;
      } catch (error: unknown) {
        lastRefreshFailure = Date.now();
        logger.error(
          'Token refresh failed',
          error instanceof Error ? error : new Error(String(error))
        );
        return false;
      } finally {
        pendingRefresh = null;
      }
    })();

    return pendingRefresh;
  } catch (error: unknown) {
    logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

export { auth, db };

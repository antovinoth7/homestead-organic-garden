/**
 * Firestore Timeout Utility
 * Prevents hanging operations and ANR errors
 * Adds configurable timeouts to all Firestore operations
 */

import { isNetworkAvailable } from './networkState';
import { logger } from './logger';
import { getErrorCode, getErrorMessage } from './errorLogging';

interface TimeoutOptions {
  timeoutMs?: number;
  throwOnTimeout?: boolean;
  fallbackValue?: unknown;
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds

export const FIRESTORE_WRITE_TIMEOUT_MS = 15000;
export const FIRESTORE_READ_TIMEOUT_MS = 10000;

/**
 * Raised when an operation outlives its timeout. Carries Firestore's own
 * `deadline-exceeded` code so callers classify it with `getErrorCode` instead
 * of matching message text — `writeOrQueue` queues on it, because a Firestore
 * write never rejects when the link is dead, it just stays pending.
 */
export class FirestoreTimeoutError extends Error {
  readonly code = 'deadline-exceeded';
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'FirestoreTimeoutError';
  }
}

/**
 * Errors a retry cannot fix. `failed-precondition` is a missing index or a
 * bad query; `resource-exhausted` is the free-tier quota — retrying either only
 * burns time (and, for quota, more of it).
 */
const NON_RETRYABLE_CODES = new Set([
  'permission-denied',
  'unauthenticated',
  'invalid-argument',
  'failed-precondition',
  'resource-exhausted',
]);

type RetryOptions = TimeoutOptions & {
  maxRetries?: number;
  baseDelayMs?: number;
  /**
   * Re-run the operation after it times out (default true). A timed-out
   * Firestore call is not cancelled — it is still pending inside the SDK — so a
   * retry re-sends the same request on a link that just proved it is stalled.
   */
  retryOnTimeout?: boolean;
};

/**
 * For reads that fall back to the AsyncStorage copy on failure. The local copy
 * is a better retry than the network: one retry for a transient error, none
 * after a timeout, so a stalled link reaches the fallback in one read timeout
 * (10s) instead of three plus backoff (up to 48s with the write timeout).
 */
export const CACHED_READ_OPTIONS: RetryOptions = {
  timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  maxRetries: 1,
  retryOnTimeout: false,
};

/**
 * Wraps a Firestore operation with timeout and network check
 */
async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, throwOnTimeout = true, fallbackValue = null } = options;

  // Check network connectivity first
  if (!isNetworkAvailable()) {
    if (throwOnTimeout) {
      throw new Error('No network connection available');
    }
    return fallbackValue as T;
  }

  return new Promise<T>((resolve, reject) => {
    let isResolved = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        const error = new FirestoreTimeoutError(timeoutMs);

        if (throwOnTimeout) {
          reject(error);
        } else {
          logger.warn(error.message);
          resolve(fallbackValue as T);
        }
      }
    }, timeoutMs);

    // Execute operation
    operation()
      .then((result) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      })
      .catch((error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
  });
}

/**
 * Throws when a failed attempt must not be retried: a timeout the caller chose
 * not to repeat, an error a retry cannot fix, or no network at all.
 */
function assertRetryable(
  error: unknown,
  code: string | undefined,
  message: string,
  retryOnTimeout: boolean
): void {
  if (!retryOnTimeout && error instanceof FirestoreTimeoutError) {
    throw error;
  }

  if (code !== undefined && NON_RETRYABLE_CODES.has(code)) {
    logger.error(`Non-retryable Firestore error (${code}), not retrying: ${message}`);
    throw error;
  }

  // Don't retry if no network
  if (!isNetworkAvailable()) {
    logger.warn('No network connection, stopping retries');
    throw new Error('No network connection available');
  }
}

/** Log network errors with more details. */
function logNetworkFailure(
  code: string | undefined,
  message: string,
  attempt: number,
  maxRetries: number
): void {
  if (code === 'unavailable' || message.includes('Failed to fetch')) {
    logger.warn(`Network unavailable (attempt ${attempt + 1}/${maxRetries + 1}): ${message}`);
  }
}

/**
 * Retry wrapper for Firestore operations
 * Automatically retries failed operations with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  retryOnTimeout: boolean = true
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const code = getErrorCode(error);
      const message = getErrorMessage(error);

      assertRetryable(error, code, message, retryOnTimeout);
      logNetworkFailure(code, message, attempt, maxRetries);

      // Last attempt failed
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn(
        `Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Combines timeout and retry logic for maximum reliability
 */
export async function withTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    throwOnTimeout = true,
    fallbackValue = null,
    maxRetries = 2,
    baseDelayMs = 1000,
    retryOnTimeout = true,
  } = options;

  return withRetry(
    () => withTimeout(operation, { timeoutMs, throwOnTimeout, fallbackValue }),
    maxRetries,
    baseDelayMs,
    retryOnTimeout
  );
}

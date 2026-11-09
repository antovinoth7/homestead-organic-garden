/**
 * Error Logging and Crash Analytics Utility
 * Centralized error tracking for better debugging
 * Can be extended with Firebase Crashlytics, Sentry, etc.
 */
import { logger } from './logger';

interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'crash' | 'network' | 'auth' | 'storage';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
}

const MAX_LOGS = 100;
const errorLogs: ErrorLog[] = [];

/**
 * Log an error for analytics
 */
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'email', 'phone', 'credential'];

const sanitizeContext = (
  context?: Record<string, unknown>
): Record<string, unknown> | undefined => {
  if (!context) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const logError = (
  type: ErrorLog['type'],
  message: string,
  error?: unknown,
  context?: Record<string, unknown>
): void => {
  const userId = currentUserId;
  const safeContext = sanitizeContext(context);
  // `operation` carries the call-site message into Sentry's custom context —
  // captureException otherwise sends only the bare error, so a timeout cannot
  // say which read stalled. Context, not a tag: some messages hold user data.
  const enrichedContext = { ...safeContext, type, userId, operation: message };
  // Timeouts and offline errors on the network path are the expected weak-link
  // fallback (the service already served the local copy) — report as warnings.
  const level = type === 'network' && isConnectivityError(error) ? 'warning' : undefined;
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type,
    message,
    stack: (error instanceof Error ? error.stack : undefined) || new Error().stack,
    context: enrichedContext,
    userId,
  };

  errorLogs.push(errorLog);

  // Keep only last MAX_LOGS entries to prevent memory issues
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.shift();
  }

  logger.error(`[${type.toUpperCase()}] ${message}`, error instanceof Error ? error : undefined);

  // Send to error tracker (can forward to Sentry)
  // Best-effort: a tracker failure must never surface as an unhandled rejection
  // from the logging path. `logger` only writes to the console, so this cannot loop.
  import('../utils/errorTracker')
    .then(({ errorTracker }) =>
      errorTracker.trackError(
        message,
        error instanceof Error ? error : undefined,
        enrichedContext,
        {
          level,
        }
      )
    )
    .catch((trackerError: unknown) => {
      logger.warn(
        'Error tracker unavailable',
        trackerError instanceof Error ? trackerError : undefined
      );
    });
};

/**
 * Log authentication errors
 */
export const logAuthError = (
  message: string,
  error?: Error,
  context?: Record<string, unknown>
): void => {
  logError('auth', message, error, context);
};

/**
 * Log storage errors
 */
export const logStorageError = (
  message: string,
  error?: Error,
  context?: Record<string, unknown>
): void => {
  logError('storage', message, error, context);
};

/**
 * Set user context for error logs
 */
let currentUserId: string | undefined;

export const setErrorLogUserId = (userId: string | undefined): void => {
  currentUserId = userId;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function getErrorCode(error: unknown): string | undefined {
  if (error != null && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

const CONNECTIVITY_CODES = new Set(['deadline-exceeded', 'unavailable']);
/** Thrown by `withTimeout` / `withRetry` in `firestoreTimeout.ts` when offline. */
const NO_NETWORK_MESSAGE = 'No network connection available';

/**
 * True for failures caused by the link rather than the request: a timeout
 * (`FirestoreTimeoutError` carries `deadline-exceeded`), Firestore
 * `unavailable`, or the offline guard. Classified by code/message, not
 * `instanceof FirestoreTimeoutError` — firestoreTimeout.ts imports this module.
 */
export function isConnectivityError(error: unknown): boolean {
  const code = getErrorCode(error);
  if (code !== undefined && CONNECTIVITY_CODES.has(code)) return true;
  return error instanceof Error && error.message === NO_NETWORK_MESSAGE;
}

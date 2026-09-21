import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

/**
 * Safe AsyncStorage Wrapper with Mutex
 * Prevents race conditions and data corruption
 * Handles concurrent reads/writes safely
 */

interface QueueItem {
  operation: () => Promise<unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic resolve/reject for queue interop
  resolve: (value: any) => void;
  reject: (error: unknown) => void;
}

const MAX_QUEUE_SIZE = 100; // Prevent memory overflow

class StorageQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Prevent queue overflow - reject if too many operations pending
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        logger.error(`Storage queue overflow: ${this.queue.length} items pending`);
        reject(new Error('Storage queue overflow - too many pending operations'));
        return;
      }

      this.queue.push({ operation, resolve, reject });
      this.process();
    });
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  private async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await item.operation();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.isProcessing = false;
  }
}

const storageQueue = new StorageQueue();

/**
 * Get current storage queue size for monitoring
 */
const _getStorageQueueSize = (): number => storageQueue.getQueueSize();

/**
 * Outcome of a strict read. `ok: false` distinguishes "the read failed" from
 * "the key holds an empty array", which `safeGetData` cannot express.
 *
 * - `shape`   — the stored value parsed but was not an array
 * - `corrupt` — the stored value was not valid JSON
 * - `io`      — AsyncStorage kept failing after every retry
 */
export type StorageRead<T> =
  | { ok: true; data: T[] }
  | { ok: false; reason: 'shape' | 'corrupt' | 'io' };

/** Move a bad blob aside instead of deleting it, so it stays recoverable. */
const quarantine = async (key: string, label: string): Promise<void> => {
  const quarantineKey = `${key}__${label}_${Date.now()}`;
  logger.error(`Unreadable data at ${key}, quarantining to ${quarantineKey}`);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw !== null) await AsyncStorage.setItem(quarantineKey, raw);
    await AsyncStorage.removeItem(key);
  } catch (clearError) {
    logger.error(`Failed to quarantine data at ${key}:`, clearError as Error);
  }
};

/**
 * Strict read: reports *why* a read produced nothing.
 *
 * Callers holding the only durable copy of user data — notably the offline
 * mutation queue — must use this rather than `safeGetData`, because they
 * read-modify-write and a failed read flattened to `[]` would persist an empty
 * queue over pending writes.
 */
export const safeReadData = async <T>(key: string, retries = 2): Promise<StorageRead<T>> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue === null) return { ok: true as const, data: [] as T[] };

        const parsed = JSON.parse(jsonValue);

        // A non-array value is as unreadable as bad JSON, and for a
        // durability-critical key it is the only copy — quarantine, don't drop.
        if (!Array.isArray(parsed)) {
          logger.warn(`Data at key ${key} is not an array`);
          await quarantine(key, 'notarray');
          return { ok: false as const, reason: 'shape' as const };
        }

        return { ok: true as const, data: parsed as T[] };
      } catch (e: unknown) {
        logger.error(`Error reading ${key} (attempt ${i + 1}/${retries + 1}):`, e as Error);

        // JSON parse error: the data is corrupted. Quarantine rather than
        // delete — for keys like the offline queue the corrupt blob is the only
        // copy of writes that never reached Firestore.
        if (e instanceof SyntaxError || (e instanceof Error && e.message?.includes('JSON'))) {
          await quarantine(key, 'corrupt');
          return { ok: false as const, reason: 'corrupt' as const };
        }

        if (i === retries) {
          logger.error(`All retries exhausted for ${key}`);
          return { ok: false as const, reason: 'io' as const };
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, i)));
      }
    }

    logger.error(`Failed to read ${key} after ${retries + 1} attempts`);
    return { ok: false as const, reason: 'io' as const };
  });
};

/**
 * Lenient read: flattens any failure to `[]`.
 *
 * Correct for caches, which can be refetched. Anything that read-modify-writes
 * the only durable copy of user data must use `safeReadData` instead.
 */
export const safeGetData = async <T>(key: string, retries = 2): Promise<T[]> => {
  const result = await safeReadData<T>(key, retries);
  return result.ok ? result.data : [];
};

/**
 * Safe set with error handling and retry logic
 */
export const safeSetData = async <T>(key: string, value: T[], retries = 2): Promise<boolean> => {
  return storageQueue.add(async () => {
    let lastError: unknown;

    // Validate input
    if (!Array.isArray(value)) {
      logger.error(`Attempted to save non-array data to ${key}`);
      return false;
    }

    for (let i = 0; i <= retries; i++) {
      try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
        return true;
      } catch (e: unknown) {
        lastError = e;
        logger.error(`Error saving ${key} (attempt ${i + 1}/${retries + 1}):`, e as Error);

        // Wait before retry
        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    }

    logger.error(`Failed to save ${key} after ${retries + 1} attempts:`, lastError as Error);
    return false;
  });
};

/**
 * Safe single value get
 */
export const safeGetItem = async (key: string, retries = 2): Promise<string | null> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e: unknown) {
        logger.error(`Error reading item ${key} (attempt ${i + 1}/${retries + 1}):`, e as Error);

        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    }

    logger.error(`Failed to read item ${key} after ${retries + 1} attempts`);
    return null;
  });
};

/**
 * Safe single value remove. Returns false when the key could not be removed.
 */
export const safeRemoveItem = async (key: string, retries = 2): Promise<boolean> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        await AsyncStorage.removeItem(key);
        return true;
      } catch (e: unknown) {
        logger.error(`Error removing item ${key} (attempt ${i + 1}/${retries + 1}):`, e as Error);

        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    }

    logger.error(`Failed to remove item ${key} after ${retries + 1} attempts`);
    return false;
  });
};

/**
 * Every key currently in storage, or an empty list if they cannot be read.
 * For housekeeping sweeps that must find keys they no longer know the shape of.
 */
export const safeGetAllKeys = async (): Promise<string[]> => {
  return storageQueue.add(async () => {
    try {
      return [...(await AsyncStorage.getAllKeys())];
    } catch (e: unknown) {
      logger.error('Error reading storage keys:', e as Error);
      return [];
    }
  });
};

/**
 * Safe bulk remove. Returns false when the batch could not be removed; callers
 * sweeping obsolete keys can ignore that — the keys simply persist.
 */
export const safeMultiRemove = async (keys: string[]): Promise<boolean> => {
  if (keys.length === 0) return true;
  return storageQueue.add(async () => {
    try {
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (e: unknown) {
      logger.error(`Error removing ${keys.length} items:`, e as Error);
      return false;
    }
  });
};

/**
 * Safe single value set
 */
export const safeSetItem = async (key: string, value: string, retries = 2): Promise<boolean> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch (e: unknown) {
        logger.error(`Error saving item ${key} (attempt ${i + 1}/${retries + 1}):`, e as Error);

        if (i < retries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    }

    logger.error(`Failed to save item ${key} after ${retries + 1} attempts`);
    return false;
  });
};

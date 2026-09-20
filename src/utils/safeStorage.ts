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
 * Safe get with error handling and retry logic
 */
export const safeGetData = async <T>(key: string, retries = 2): Promise<T[]> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue === null) return [];

        const parsed = JSON.parse(jsonValue);

        // Validate that parsed data is an array
        if (!Array.isArray(parsed)) {
          logger.warn(`Data at key ${key} is not an array, returning empty array`);
          return [];
        }

        return parsed;
      } catch (e: unknown) {
        logger.error(`Error reading ${key} (attempt ${i + 1}/${retries + 1}):`, e as Error);

        // If JSON parse error, data is corrupted. Quarantine rather than delete:
        // for keys like the offline queue the corrupt blob is the only copy of
        // writes that never reached Firestore, so it must stay recoverable.
        if (e instanceof SyntaxError || (e instanceof Error && e.message?.includes('JSON'))) {
          const quarantineKey = `${key}__corrupt_${Date.now()}`;
          logger.error(`Corrupted data at ${key}, quarantining to ${quarantineKey}`, e as Error);
          try {
            const raw = await AsyncStorage.getItem(key);
            if (raw !== null) await AsyncStorage.setItem(quarantineKey, raw);
            await AsyncStorage.removeItem(key);
          } catch (clearError) {
            logger.error(`Failed to quarantine corrupted data at ${key}:`, clearError as Error);
          }
          return [];
        }

        // On last retry, return empty array instead of throwing
        if (i === retries) {
          logger.error(`All retries exhausted for ${key}, returning empty array`);
          return [];
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, i)));
      }
    }

    logger.error(`Failed to read ${key} after ${retries + 1} attempts`);
    return [];
  });
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

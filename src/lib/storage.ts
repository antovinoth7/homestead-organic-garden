import { safeGetData, safeSetData, safeRemoveItem } from '../utils/safeStorage';
import { logStorageError } from '../utils/errorLogging';
import { invalidateAll } from './dataCache';
import { logger } from '../utils/logger';

const STORAGE_KEYS = {
  PLANTS: '@garden_plants',
  TASKS: '@garden_tasks',
  TASK_LOGS: '@garden_task_logs',
  JOURNAL: '@garden_journal',
  LAST_SYNC: '@garden_last_sync',
  OFFLINE_QUEUE: '@garden_offline_queue',
  LOCATIONS: '@garden_locations',
  PLANT_CATALOG: '@garden_plant_catalog',
  PLANT_CARE_PROFILES: '@garden_plant_care_profiles',
  PLANT_PROFILES: '@garden_plant_profiles',
  BEDS: '@garden_beds',
  FARM_CONFIG: '@garden_farm_config',
  WEATHER: '@garden_weather',
  ONBOARDING_COMPLETE: '@garden_onboarding_complete',
  CATALOG_RECENT_SEARCHES: '@garden_catalog_recent_searches',
};

// Export as KEYS for backwards compatibility
export const KEYS = STORAGE_KEYS;

// Generic storage functions with safe wrapper
export const getData = async <T>(key: string): Promise<T[]> => {
  try {
    return await safeGetData<T>(key);
  } catch (e) {
    logStorageError(`Error reading ${key}`, e as Error);
    return [];
  }
};

/**
 * Persist an array under `key`. Returns false when the value did not reach
 * AsyncStorage (retries exhausted, quota, or a thrown error) so durability-
 * sensitive callers — notably the offline queue — can refuse to report success.
 */
export const setData = async <T>(key: string, value: T[]): Promise<boolean> => {
  try {
    return await safeSetData(key, value);
  } catch (e) {
    logStorageError(`Error saving ${key}`, e as Error);
    return false;
  }
};

/**
 * Returns the AsyncStorage key for location config scoped to the given uid.
 * Falls back to the shared key only when uid is unavailable (e.g. signed-out
 * reads, which are discarded immediately anyway).
 */
export const getLocationStorageKey = (uid: string | null | undefined): string => {
  if (uid) return `@garden_locations_${uid}`;
  return STORAGE_KEYS.LOCATIONS; // legacy fallback, never persisted for a new user
};

/**
 * Keys `clearAllData` must not write `[]` into.
 *
 * - OFFLINE_QUEUE holds writes that never reached Firestore; it is their only
 *   durable copy, so clearing it destroys user data.
 * - ONBOARDING_COMPLETE is user state, not a cache — it is preserved outright.
 * - LAST_SYNC is a scalar string; it is removed rather than overwritten,
 *   because writing `[]` leaves the literal "[]" behind.
 *
 * The last two are written via `safeSetItem` as plain strings, so the array
 * write used for every other key corrupts them.
 */
const PRESERVED_KEYS: string[] = [STORAGE_KEYS.OFFLINE_QUEUE, STORAGE_KEYS.ONBOARDING_COMPLETE];
const SCALAR_KEYS_TO_REMOVE: string[] = [STORAGE_KEYS.LAST_SYNC];

/**
 * Clear cached data from AsyncStorage.
 *
 * Safe by design: this only drops data that can be re-fetched from Firestore.
 * OFFLINE_QUEUE is deliberately preserved — queued mutations have not reached
 * the server, so the queue is their only durable copy and clearing it would
 * destroy user data. Callers wanting to discard pending writes must ask the
 * user and call `clearQueue()` from src/lib/offlineQueue.ts explicitly.
 *
 * Optionally clears the uid-scoped location key when uid is provided.
 */
export const clearAllData = async (uid?: string): Promise<void> => {
  try {
    invalidateAll();
    const keys = Object.values(STORAGE_KEYS).filter(
      (key) => !PRESERVED_KEYS.includes(key) && !SCALAR_KEYS_TO_REMOVE.includes(key)
    );
    for (const key of keys) {
      await safeSetData(key, []);
    }
    for (const key of SCALAR_KEYS_TO_REMOVE) {
      await safeRemoveItem(key);
    }
    // Also clear uid-scoped locations key if uid is known
    if (uid) {
      await safeSetData(getLocationStorageKey(uid), []);
    }
    logger.info('Local cache cleared successfully (pending offline writes preserved)');
  } catch (e) {
    logStorageError('Error clearing cache', e as Error);
    throw e;
  }
};

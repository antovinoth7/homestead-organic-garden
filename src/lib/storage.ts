import { safeGetData, safeSetData } from '../utils/safeStorage';
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

export const setData = async <T>(key: string, value: T[]): Promise<void> => {
  try {
    await safeSetData(key, value);
  } catch (e) {
    logStorageError(`Error saving ${key}`, e as Error);
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
 * Clear all cached data from AsyncStorage
 * This is safe - doesn't affect Firebase, just local cache
 * Optionally clears the uid-scoped location key when uid is provided
 */
export const clearAllData = async (uid?: string): Promise<void> => {
  try {
    invalidateAll();
    const keys = Object.values(STORAGE_KEYS);
    for (const key of keys) {
      await safeSetData(key, []);
    }
    // Also clear uid-scoped locations key if uid is known
    if (uid) {
      await safeSetData(getLocationStorageKey(uid), []);
    }
    logger.info('Local cache cleared successfully');
  } catch (e) {
    logStorageError('Error clearing cache', e as Error);
    throw e;
  }
};

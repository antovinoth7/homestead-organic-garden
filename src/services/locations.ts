import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, refreshAuthToken } from '../lib/firebase';
import { getData, setData, getLocationStorageKey } from '../lib/storage';
import { getCached, setCached, dedup, CACHE_KEYS } from '../lib/dataCache';
import { LocationConfig } from '../types/database.types';
import { logError } from '../utils/errorLogging';
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from '../utils/firestoreTimeout';

/**
 * Auto-generate a short name from a location name.
 * Takes consonants first (up to 3), then fills with remaining chars. Always uppercase, 3 chars.
 */
export const generateShortName = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  if (!cleaned) return 'LOC';
  const consonants = cleaned.replace(/[AEIOU]/g, '');
  if (consonants.length >= 3) return consonants.slice(0, 3);
  // Fill remainder from the full string
  const chars: string[] = [...consonants];
  for (const ch of cleaned) {
    if (chars.length >= 3) break;
    if (!chars.includes(ch)) chars.push(ch);
  }
  // If still short, just take first 3 chars of the cleaned name
  while (chars.length < 3) {
    chars.push(cleaned[chars.length] ?? 'X');
  }
  return chars.join('').slice(0, 3);
};

const MAX_LIST_SIZE = 100;
const MAX_NAME_LENGTH = 200;

const normalizeList = (values: string[] | undefined | null): string[] => {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    if (result.length >= MAX_LIST_SIZE) return;
    const trimmed = (value ?? '').toString().trim();
    if (!trimmed || trimmed.length > MAX_NAME_LENGTH) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

const SETTINGS_COLLECTION = 'user_settings';
const LOCATIONS_FIELD = 'locations';

const normalizeShortNames = (
  shortNames: Record<string, string> | undefined | null,
  parentLocations: string[]
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const loc of parentLocations) {
    const existing = shortNames?.[loc]?.trim().toUpperCase().slice(0, 5);
    if (existing && existing.length >= 2) {
      result[loc] = existing;
    } else {
      result[loc] = generateShortName(loc);
    }
  }
  return result;
};

const normalizeConfig = (config?: LocationConfig | null): LocationConfig => {
  const normalizedParents = normalizeList(config?.parentLocations);
  const normalizedChildren = normalizeList(config?.childLocations);

  return {
    parentLocations: normalizedParents,
    childLocations: normalizedChildren,
    parentLocationShortNames: normalizeShortNames(
      config?.parentLocationShortNames,
      normalizedParents
    ),
    parentLocationProfiles: config?.parentLocationProfiles ?? {},
  };
};

const getCachedConfig = async (uid: string | null | undefined): Promise<LocationConfig> => {
  const key = getLocationStorageKey(uid);
  const stored = await getData<LocationConfig>(key);
  if (stored.length > 0 && stored[0]) {
    return normalizeConfig(stored[0]);
  }
  // No cached data — empty config is the correct default
  return { parentLocations: [], childLocations: [] };
};

export const getLocationConfig = async (): Promise<LocationConfig> => {
  const user = auth.currentUser;
  const uid = user?.uid ?? null;

  // Layer 1: in-memory cache
  const cacheKey = uid ? `${CACHE_KEYS.LOCATIONS}:${uid}` : CACHE_KEYS.LOCATIONS;
  const memCached = getCached<LocationConfig>(cacheKey);
  if (memCached) return memCached;

  // Layer 2: AsyncStorage
  const asyncCached = await getCachedConfig(uid);

  if (!user) {
    setCached(cacheKey, asyncCached);
    return asyncCached;
  }

  await refreshAuthToken();

  return dedup(cacheKey, async () => {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
      const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
        timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
      });

      if (!snapshot.exists()) {
        // New user: persist the empty config to their document
        // (so getDoc next time returns something, avoiding another write)
        await withTimeoutAndRetry(
          () =>
            setDoc(
              docRef,
              {
                [LOCATIONS_FIELD]: { parentLocations: [], childLocations: [] },
                updated_at: serverTimestamp(),
              },
              { merge: true }
            ),
          { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, maxRetries: 1, throwOnTimeout: false }
        );
        const empty: LocationConfig = { parentLocations: [], childLocations: [] };
        await setData(getLocationStorageKey(uid), [empty]);
        setCached(cacheKey, empty);
        return empty;
      }

      const data = snapshot.data() as Record<string, unknown>;
      const remoteConfig = normalizeConfig(
        (data[LOCATIONS_FIELD] as LocationConfig | undefined) ?? null
      );
      await setData(getLocationStorageKey(uid), [remoteConfig]);
      setCached(cacheKey, remoteConfig);
      return remoteConfig;
    } catch (error) {
      logError('network', 'Failed to fetch location config', error as Error, {
        userId: user.uid,
      });
      // Fall back to AsyncStorage data (may be empty, which is correct)
      return asyncCached;
    }
  });
};

export const saveLocationConfig = async (config: LocationConfig): Promise<LocationConfig> => {
  const normalized = normalizeConfig(config);
  const user = auth.currentUser;
  const uid = user?.uid ?? null;
  const storageKey = getLocationStorageKey(uid);
  const cacheKey = uid ? `${CACHE_KEYS.LOCATIONS}:${uid}` : CACHE_KEYS.LOCATIONS;

  await setData(storageKey, [normalized]);
  setCached(cacheKey, normalized);

  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [LOCATIONS_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true }
        ),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, throwOnTimeout: false }
    );
  } catch (error) {
    logError('network', 'Failed to save location config', error as Error, {
      userId: user.uid,
    });
  }

  return normalized;
};

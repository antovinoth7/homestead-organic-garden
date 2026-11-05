import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { Plant } from '@/types/database.types';
import { getAllPlants, getCachedPlants } from '@/services/plants';
import { getLocationConfig } from '@/services/locations';
import { CACHE_KEYS, invalidate } from '@/lib/dataCache';
import { getErrorMessage } from '@/utils/errorLogging';
import { logger } from '@/utils/logger';
import { reuseIfSameItems } from '@/utils/structuralShare';

export interface UsePlantListResult {
  /** Active plants. Unchanged plants keep their identity across refreshes. */
  plants: Plant[];
  parentLocations: string[];
  childLocations: string[];
  /** True until the first load settles; later focuses revalidate silently. */
  loading: boolean;
  /** A pull-to-refresh is in flight. */
  refreshing: boolean;
  /** Pull-to-refresh: reaches past the 30 s cache, unlike a focus revalidate. */
  refresh: () => Promise<void>;
  /** Silent revalidate, e.g. after a delete commits or fails. */
  reload: () => Promise<void>;
}

/**
 * The Plants list's data: every active plant plus the location names its filter
 * sheet offers, refreshed on focus.
 *
 * Built so that coming back to the tab costs nothing when nothing changed:
 * - a refocus never shows the spinner — only the first load does;
 * - `getAllPlants` hands back the same objects (and array) for unchanged data,
 *   so `setPlants` bails out and memoized cards skip;
 * - the location arrays are kept when their names did not change.
 */
export function usePlantList(): UsePlantListResult {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [parentLocations, setParentLocations] = useState<string[]>([]);
  const [childLocations, setChildLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);

  const fetchLocations = useCallback(async (): Promise<void> => {
    try {
      const config = await getLocationConfig();
      setParentLocations((prev) => reuseIfSameItems(prev, config.parentLocations));
      setChildLocations((prev) => reuseIfSameItems(prev, config.childLocations));
    } catch (error) {
      logger.error('Error loading locations', error as Error);
    }
  }, []);

  /** Plants and locations in parallel; alerts on failure only when asked. */
  const fetchAll = useCallback(
    async (alertOnError: boolean): Promise<void> => {
      const locations = fetchLocations();
      try {
        setPlants(await getAllPlants());
      } catch (error: unknown) {
        if (alertOnError) Alert.alert('Error', getErrorMessage(error));
        else logger.warn('Plants list: background refresh failed', error as Error);
      }
      await locations;
    },
    [fetchLocations]
  );

  const reload = useCallback(() => fetchAll(false), [fetchAll]);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      // A pull must reach past the 30 s cache, or it re-reads what is on screen.
      invalidate(CACHE_KEYS.ALL_PLANTS);
      await fetchAll(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAll]);

  useFocusEffect(
    useCallback(() => {
      // Apply any surgical cache update (e.g. a bed deletion) at once so removed
      // plants don't linger while the revalidate runs. Same array → no render.
      const instant = getCachedPlants();
      if (instant !== null) setPlants(instant);

      if (hasLoadedRef.current) {
        void fetchAll(false);
        return;
      }
      hasLoadedRef.current = true;
      void fetchAll(true).finally(() => setLoading(false));
    }, [fetchAll])
  );

  return { plants, parentLocations, childLocations, loading, refreshing, refresh, reload };
}

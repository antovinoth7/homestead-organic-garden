import { useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  DEFAULT_PLANT_PROFILES,
  PLANT_CATEGORIES,
  getPlantProfiles,
  getPlantNamesForType,
  getMergedProfiles,
  getHiddenPlantNames,
  restorePlantProfile,
} from '@/services/plantProfiles';
import { getAllPlants, getStoredPlants } from '@/services/plants';
import { Plant, PlantProfiles, PlantType } from '@/types/database.types';
import { getErrorMessage } from '@/utils/errorLogging';

export interface CategoryData {
  plantNames: string[];
  counts: Record<string, number>;
  isEmpty: boolean;
}

export interface UsePlantCatalogManagerReturn {
  profiles: PlantProfiles;
  /**
   * Bundled defaults with the user's edits, additions and deletions applied.
   * Search indexes this — `profiles` alone holds only the overrides, and is
   * empty on an install where nothing has been edited.
   */
  mergedProfiles: PlantProfiles;
  plants: Plant[];
  activeCategory: PlantType;
  setActiveCategory: (category: PlantType) => void;
  loading: boolean;
  /** True while a pull-to-refresh is in flight — drives the RefreshControl. */
  refreshing: boolean;
  categoryData: CategoryData;
  /**
   * Re-reads the catalog. `silent` keeps the current list on screen instead of
   * swapping it for the full-screen spinner — used for every revalidate after
   * the first load, so returning to the screen doesn't flash.
   */
  reload: (options?: { silent?: boolean }) => Promise<void>;
  /** Pull-to-refresh: revalidates silently while showing the RefreshControl. */
  refresh: () => Promise<void>;
  /** Total catalog plant count per category — drives pill badges. */
  allCategoryCounts: Record<PlantType, number>;
  /** Garden-plant counts keyed by category then variety name — feeds search. */
  plantCountsByType: Record<PlantType, Record<string, number>>;
  /** Bundled entries the user deleted from the active category. */
  hiddenPlantNames: string[];
  /** Un-hides a deleted bundled entry, then reloads the catalog. */
  restore: (name: string) => Promise<void>;
}

export function usePlantCatalogManager(): UsePlantCatalogManagerReturn {
  const [profiles, setProfiles] = useState<PlantProfiles>(DEFAULT_PLANT_PROFILES);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PlantType>('vegetable');

  /** False until the first load resolves, so only that one shows the spinner. */
  const hasLoadedRef = useRef(false);

  const reload = useCallback(async (options?: { silent?: boolean }): Promise<void> => {
    if (!options?.silent) setLoading(true);
    try {
      // The catalog list renders no plant photos — `plants` feeds only the
      // per-variety count badges below. So use the image-free, offline-first
      // reader (as useBedData does) rather than getAllPlants, which paginates
      // Firestore a page at a time and resolves every plant's local image.
      // Fall back to the full fetch only on a cold cache, so counts stay right.
      const [profilesData, storedPlants] = await Promise.all([
        getPlantProfiles(),
        getStoredPlants(),
      ]);
      const allPlants = storedPlants.length > 0 ? storedPlants : await getAllPlants();
      setProfiles(profilesData);
      setPlants(allPlants);
      hasLoadedRef.current = true;
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error) ?? 'Failed to load plant catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    try {
      await reload({ silent: true });
    } finally {
      setRefreshing(false);
    }
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      // Revalidate on every focus, but only tear the list down for the spinner
      // on the very first one — a return trip from the detail screen is usually
      // a warm cache hit and shouldn't flash.
      void reload({ silent: hasLoadedRef.current });
    }, [reload])
  );

  // Per-type plant counts keyed by variety name
  const plantCountsByType = useMemo(() => {
    const counts: Record<PlantType, Record<string, number>> = {
      vegetable: {},
      herb: {},
      flower: {},
      fruit_tree: {},
      timber_tree: {},
      coconut_tree: {},
      shrub: {},
      spinach: {},
    };
    plants.forEach((plant) => {
      const type = plant.plant_type;
      const variety = plant.plant_variety ?? '';
      if (!type || !variety) return;
      counts[type][variety] = (counts[type][variety] || 0) + 1;
    });
    return counts;
  }, [plants]);

  // Derived data for the active category — single source for plantNames + counts
  const categoryData = useMemo((): CategoryData => {
    const plantNames = getPlantNamesForType(profiles, activeCategory);
    const counts = plantCountsByType[activeCategory] ?? {};
    return { plantNames, counts, isEmpty: plantNames.length === 0 };
  }, [profiles, activeCategory, plantCountsByType]);

  // Total catalog count per category — drives pill badges (no duplicate call needed)
  const allCategoryCounts = useMemo(() => {
    const result = {} as Record<PlantType, number>;
    for (const cat of PLANT_CATEGORIES) {
      result[cat] = getPlantNamesForType(profiles, cat).length;
    }
    return result;
  }, [profiles]);

  const mergedProfiles = useMemo(() => getMergedProfiles(profiles), [profiles]);

  const hiddenPlantNames = useMemo(
    () => getHiddenPlantNames(profiles)[activeCategory] ?? [],
    [profiles, activeCategory]
  );

  const restore = useCallback(
    async (name: string): Promise<void> => {
      try {
        await restorePlantProfile(activeCategory, name);
        // Silent: the list is already on screen, so update it in place rather
        // than blanking it behind the spinner.
        await reload({ silent: true });
      } catch (error: unknown) {
        Alert.alert('Error', getErrorMessage(error) ?? 'Failed to restore the plant.');
      }
    },
    [activeCategory, reload]
  );

  return {
    profiles,
    mergedProfiles,
    plants,
    activeCategory,
    setActiveCategory,
    loading,
    refreshing,
    categoryData,
    reload,
    refresh,
    allCategoryCounts,
    plantCountsByType,
    hiddenPlantNames,
    restore,
  };
}

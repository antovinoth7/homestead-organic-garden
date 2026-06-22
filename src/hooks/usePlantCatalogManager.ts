import { useState, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  DEFAULT_PLANT_PROFILES,
  PLANT_CATEGORIES,
  getPlantProfiles,
  getPlantNamesForType,
} from '@/services/plantProfiles';
import { getAllPlants } from '@/services/plants';
import { Plant, PlantProfiles, PlantType } from '@/types/database.types';
import { getErrorMessage, logError } from '@/utils/errorLogging';

export interface CategoryData {
  plantNames: string[];
  counts: Record<string, number>;
  isEmpty: boolean;
}

export interface UsePlantCatalogManagerReturn {
  profiles: PlantProfiles;
  plants: Plant[];
  activeCategory: PlantType;
  setActiveCategory: (category: PlantType) => void;
  loading: boolean;
  categoryData: CategoryData;
  reload: () => Promise<void>;
  /** Total catalog plant count per category — drives pill badges. */
  allCategoryCounts: Record<PlantType, number>;
}

export function usePlantCatalogManager(): UsePlantCatalogManagerReturn {
  const [profiles, setProfiles] = useState<PlantProfiles>(DEFAULT_PLANT_PROFILES);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<PlantType>('vegetable');
  const hasLoadedRef = useRef(false);

  // Profiles are the essential data — the visible catalog (names + tabs) comes from
  // here, and they resolve instantly from the in-memory cache / static defaults.
  const loadProfiles = useCallback(async (): Promise<void> => {
    try {
      const profilesData = await getPlantProfiles();
      setProfiles(profilesData);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error) ?? 'Failed to load plant catalog.');
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

  // Plant counts only drive the decorative per-row "how many I'm growing" badge.
  // getAllPlants() paginates Firestore, so it must never gate the spinner — load it
  // in the background and fail silently (the catalog stays fully usable without it).
  const loadCounts = useCallback(async (): Promise<void> => {
    try {
      setPlants(await getAllPlants());
    } catch (error: unknown) {
      logError('network', 'usePlantCatalogManager: plant counts load failed', error as Error);
    }
  }, []);

  const reload = useCallback(async (): Promise<void> => {
    await Promise.all([loadProfiles(), loadCounts()]);
  }, [loadProfiles, loadCounts]);

  useFocusEffect(
    useCallback(() => {
      // Only show the full-screen spinner on the very first load. On re-focus, cached
      // profiles return immediately and counts refresh in place — no spinner flash,
      // scroll position preserved.
      if (!hasLoadedRef.current) setLoading(true);
      void loadProfiles();
      void loadCounts();
    }, [loadProfiles, loadCounts])
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

  return {
    profiles,
    plants,
    activeCategory,
    setActiveCategory,
    loading,
    categoryData,
    reload,
    allCategoryCounts,
  };
}

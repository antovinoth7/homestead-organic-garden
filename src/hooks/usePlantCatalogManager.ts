import { useState, useCallback, useMemo } from 'react';
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
import { getErrorMessage } from '@/utils/errorLogging';

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

  const reload = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const [profilesData, allPlants] = await Promise.all([getPlantProfiles(), getAllPlants()]);
      setProfiles(profilesData);
      setPlants(allPlants);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error) ?? 'Failed to load plant catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
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

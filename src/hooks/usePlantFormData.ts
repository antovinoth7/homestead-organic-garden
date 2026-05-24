import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getAllPlants } from '@/services/plants';
import { getLocationConfig } from '@/services/locations';
import {
  DEFAULT_PLANT_PROFILES,
  getPlantProfiles,
  getPlantNamesForType,
  toPlantCatalogShape,
  toPlantCareProfilesShape,
} from '@/services/plantProfiles';
import {
  LocationProfile,
  Plant,
  PlantType,
  PlantCatalog,
  PlantCareProfiles,
  PlantProfiles,
} from '@/types/database.types';
import { logger } from '@/utils/logger';

export interface UsePlantFormDataReturn {
  existingPlants: Plant[];
  setExistingPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  plantCatalog: PlantCatalog;
  plantCareProfiles: Partial<PlantCareProfiles>;
  careProfilesLoaded: boolean;
  locationShortNames: Record<string, string>;
  locationProfiles: Record<string, LocationProfile>;
  parentLocationOptions: string[];
  childLocationOptions: string[];
  specificPlantOptions: string[];
  varietySuggestions: string[];
  harvestSeasonOptions: string[];
  basicFieldCount: number;
  locationFieldCount: number;
  harvestSectionFieldCount: number;
  notesHistoryFieldCount: number;
}

const TAMIL_NADU_HARVEST_SEASONS = [
  'Year Round',
  'Summer (Mar-May)',
  'Southwest Monsoon (Jun-Sep)',
  'Northeast Monsoon (Oct-Dec)',
  'Cool Dry (Jan-Feb)',
];

interface UsePlantFormDataOptions {
  plantType: PlantType | string;
  plantVariety: string;
  parentLocation: string;
  childLocation: string;
  harvestSeason: string;
  formMode: 'quick' | 'advanced';
  customVarietyMode: boolean;
}

export function usePlantFormData({
  plantType,
  plantVariety,
  parentLocation,
  childLocation,
  harvestSeason,
  formMode,
  customVarietyMode,
}: UsePlantFormDataOptions): UsePlantFormDataReturn {
  const [existingPlants, setExistingPlants] = useState<Plant[]>([]);
  const [plantProfiles, setPlantProfiles] = useState<PlantProfiles>(DEFAULT_PLANT_PROFILES);
  const [careProfilesLoaded, setCareProfilesLoaded] = useState(false);
  const [parentLocations, setParentLocations] = useState<string[]>([]);
  const [childLocations, setChildLocations] = useState<string[]>([]);
  const [locationShortNames, setLocationShortNames] = useState<Record<string, string>>({});
  const [locationProfiles, setLocationProfiles] = useState<Record<string, LocationProfile>>({});

  const loadLocations = useCallback(async (): Promise<void> => {
    try {
      const config = await getLocationConfig();
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
      setLocationShortNames(config.parentLocationShortNames ?? {});
      setLocationProfiles(config.parentLocationProfiles ?? {});
    } catch (error) {
      logger.error('Error loading locations', error as Error);
    }
  }, []);

  const loadPlantProfiles = useCallback(async (): Promise<void> => {
    try {
      const profiles = await getPlantProfiles();
      setPlantProfiles(profiles);
    } catch (error) {
      logger.error('Error loading plant profiles', error as Error);
    } finally {
      setCareProfilesLoaded(true);
    }
  }, []);

  const loadExistingPlants = useCallback(async (): Promise<void> => {
    try {
      const plants = await getAllPlants();
      setExistingPlants(plants);
    } catch (error) {
      logger.error('Error loading plants for naming', error as Error);
    }
  }, []);

  const loadAllReferenceData = useCallback((): void => {
    loadLocations();
    loadPlantProfiles();
    loadExistingPlants();
  }, [loadLocations, loadPlantProfiles, loadExistingPlants]);

  useEffect(() => {
    loadAllReferenceData();
  }, [loadAllReferenceData]);

  useFocusEffect(
    React.useCallback(() => {
      loadAllReferenceData();
    }, [loadAllReferenceData])
  );

  // Bridge shapes for callers that still read PlantCatalog / PlantCareProfiles
  const plantCatalog = React.useMemo(() => toPlantCatalogShape(plantProfiles), [plantProfiles]);
  const plantCareProfiles = React.useMemo(
    () => toPlantCareProfilesShape(plantProfiles),
    [plantProfiles]
  );

  const parentLocationOptions = React.useMemo(() => {
    if (parentLocation && !parentLocations.includes(parentLocation)) {
      return [parentLocation, ...parentLocations];
    }
    return parentLocations;
  }, [parentLocations, parentLocation]);

  const childLocationOptions = React.useMemo(() => {
    if (childLocation && !childLocations.includes(childLocation)) {
      return [childLocation, ...childLocations];
    }
    return childLocations;
  }, [childLocations, childLocation]);

  const specificPlantOptions = React.useMemo(() => {
    const plants = getPlantNamesForType(plantProfiles, plantType as PlantType);
    if (plantVariety && !plants.includes(plantVariety)) {
      return [plantVariety, ...plants];
    }
    return plants;
  }, [plantProfiles, plantType, plantVariety]);

  const varietySuggestions = React.useMemo(() => {
    if (!plantVariety) return [];
    return plantProfiles[plantType as PlantType]?.[plantVariety]?.varieties ?? [];
  }, [plantProfiles, plantType, plantVariety]);

  const harvestSeasonOptions = React.useMemo(() => {
    if (!harvestSeason) return TAMIL_NADU_HARVEST_SEASONS;
    if (TAMIL_NADU_HARVEST_SEASONS.includes(harvestSeason)) {
      return TAMIL_NADU_HARVEST_SEASONS;
    }
    return [harvestSeason, ...TAMIL_NADU_HARVEST_SEASONS];
  }, [harvestSeason]);

  const basicFieldCount = React.useMemo(() => {
    let count = 3;
    if (formMode === 'advanced') {
      count += 2;
      if (varietySuggestions.length > 0 && customVarietyMode) {
        count += 1;
      }
    }
    return count;
  }, [formMode, varietySuggestions.length, customVarietyMode]);

  const locationFieldCount = React.useMemo(() => {
    let count = 1;
    if (parentLocation !== '') {
      count += 1;
    }
    if (formMode === 'advanced') {
      count += 1;
    }
    return count;
  }, [formMode, parentLocation]);

  const harvestSectionFieldCount = React.useMemo(() => {
    return (plantType as PlantType) === 'fruit_tree' ? 4 : 2;
  }, [plantType]);

  const notesHistoryFieldCount = React.useMemo(() => {
    return 1;
  }, []);

  return {
    existingPlants,
    setExistingPlants,
    plantCatalog,
    plantCareProfiles,
    careProfilesLoaded,
    locationShortNames,
    locationProfiles,
    parentLocationOptions,
    childLocationOptions,
    specificPlantOptions,
    varietySuggestions,
    harvestSeasonOptions,
    basicFieldCount,
    locationFieldCount,
    harvestSectionFieldCount,
    notesHistoryFieldCount,
  };
}

import { PlantCareProfile } from '@/types/database.types';
import { buildProfileKey } from '@/utils/plantCareDefaults/profileKey';

/**
 * Agathi and Castor. They no longer share a category — agathi keerai is filed
 * under `spinach` with the other keerai — but they are still the same pair of
 * fast-growing chop-and-drop plants this file was added for, so the profiles
 * stay together rather than being split across two files for the sake of the
 * name.
 */
export const NEW_SHRUB_OVERRIDES: Record<string, PlantCareProfile> = {
  [buildProfileKey('spinach', 'Agathi')]: {
    waterRequirement: 'low',
    wateringFrequencyDays: 5,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 45,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'vegetative',
    scientificName: 'Sesbania grandiflora',
    taxonomicFamily: 'Fabaceae',
    lifecycle: 'perennial',
    tamilName: 'அகத்தி',
    description:
      'Tall nitrogen-fixing legume picked over for agathi keerai and its edible flowers; also a chop-and-drop dynamic accumulator',
    daysToHarvest: { min: 45, max: 90 },
    heightCm: { min: 300, max: 800 },
    spacingCm: 200,
    plantingDepthCm: 5,
    growingSeason: 'Year Round',
    germinationDays: { min: 5, max: 10 },
    germinationTempC: { min: 22, max: 35 },
    soilPhRange: { min: 5.5, max: 7.5 },
    heatTolerance: 'high',
    droughtTolerance: 'high',
    petToxicity: false,
    feedingIntensity: 'light',
    growthStageDurations: { seedling: 21, vegetative: 45, mature: 24 },
  },
  [buildProfileKey('shrub', 'Castor')]: {
    waterRequirement: 'low',
    wateringFrequencyDays: 7,
    fertilisingFrequencyDays: 45,
    pruningFrequencyDays: 90,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'vegetative',
    scientificName: 'Ricinus communis',
    taxonomicFamily: 'Euphorbiaceae',
    lifecycle: 'perennial',
    tamilName: 'ஆமணக்கு',
    description:
      'Tall fast-growing shrub with repellent properties; pest-deterrent companion around vegetable beds',
    daysToHarvest: { min: 90, max: 120 },
    heightCm: { min: 100, max: 300 },
    spacingCm: 150,
    plantingDepthCm: 3,
    growingSeason: 'Year Round',
    germinationDays: { min: 7, max: 14 },
    germinationTempC: { min: 20, max: 30 },
    soilPhRange: { min: 5.0, max: 8.0 },
    heatTolerance: 'high',
    droughtTolerance: 'high',
    petToxicity: true,
    feedingIntensity: 'light',
    growthStageDurations: { seedling: 21, vegetative: 60, mature: 39 },
  },

};

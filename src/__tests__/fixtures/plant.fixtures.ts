import {
  Plant,
  PlantProfile,
  PlantProfiles,
  PlantType,
} from '../../types/database.types';

/** Every PlantType key, so callers never hand-write eight empty buckets. */
const PLANT_TYPES: PlantType[] = [
  'vegetable',
  'herb',
  'flower',
  'fruit_tree',
  'timber_tree',
  'coconut_tree',
  'shrub',
  'spinach',
];

export function makePlantProfile(overrides: Partial<PlantProfile> = {}): PlantProfile {
  return {
    plantType: 'vegetable',
    name: 'Tomato',
    ...overrides,
  };
}

/** Builds a fully-keyed PlantProfiles map from a flat list of profiles. */
export function makePlantProfiles(entries: readonly PlantProfile[] = []): PlantProfiles {
  const profiles = {} as PlantProfiles;
  for (const type of PLANT_TYPES) {
    profiles[type] = {};
  }
  for (const entry of entries) {
    profiles[entry.plantType][entry.name] = entry;
  }
  return profiles;
}

/** Empty per-type garden counts, matching the shape searchCatalog expects. */
export function makeCountsByType(
  counts: Partial<Record<PlantType, Record<string, number>>> = {}
): Record<PlantType, Record<string, number>> {
  const result = {} as Record<PlantType, Record<string, number>>;
  for (const type of PLANT_TYPES) {
    result[type] = counts[type] ?? {};
  }
  return result;
}

export function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'test-plant-id',
    user_id: 'test-user-id',
    name: 'Test Tomato',
    plant_type: 'vegetable',
    photo_url: null,
    space_type: 'bed',
    location: 'Front Garden',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

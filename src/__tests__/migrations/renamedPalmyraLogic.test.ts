import {
  MERGED_SURVIVOR_TYPE_V14,
  RENAMED_PLANT_NAMES_V14,
} from '@/migrations/renamedPalmyraLogic';
import { planStrandedRename } from '@/migrations/removedCatalogPlantsLogic';
import { plannedVarietyRename } from '@/migrations/mergedPlantNamesLogic';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';

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

const createEmptyProfiles = (): PlantProfiles =>
  PLANT_TYPES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantProfiles);

const withEntry = (type: PlantType, name: string, entry: Partial<PlantProfile>): PlantProfiles => {
  const profiles = createEmptyProfiles();
  profiles[type] = { [name]: { plantType: type, name, ...entry } };
  return profiles;
};

const palmyra = (): PlantProfiles =>
  withEntry('fruit_tree', 'Palmyra', { tamilName: 'பனை', spacingCm: 800 });

const rename = (profiles: PlantProfiles): PlantProfiles | null =>
  planStrandedRename(profiles, RENAMED_PLANT_NAMES_V14, MERGED_SURVIVOR_TYPE_V14);

describe('migration 014 — Palmyra → Palm Tree', () => {
  it('renames onto a row the bundled catalog actually has', () => {
    const names = new Set(PLANT_CATALOG_ENTRIES.map((entry) => entry.name));
    expect(names.has('Palm Tree')).toBe(true);
    expect(names.has('Palmyra')).toBe(false);
  });

  it('renames a garden plant recorded as Palmyra', () => {
    expect(plannedVarietyRename('Palmyra', RENAMED_PLANT_NAMES_V14)).toBe('Palm Tree');
    expect(plannedVarietyRename('Coconut', RENAMED_PLANT_NAMES_V14)).toBeNull();
  });

  it('moves the stored override onto Palm Tree and tombstones Palmyra', () => {
    const next = rename(palmyra())!;
    expect(next.fruit_tree['Palm Tree']).toEqual(
      expect.objectContaining({ name: 'Palm Tree', plantType: 'fruit_tree', spacingCm: 800 })
    );
    expect(next.fruit_tree.Palmyra!.isDeleted).toBe(true);
  });

  it('does not overwrite edits already made under Palm Tree', () => {
    const profiles = palmyra();
    profiles.fruit_tree['Palm Tree'] = {
      plantType: 'fruit_tree',
      name: 'Palm Tree',
      description: 'The one by the well',
    };
    const next = rename(profiles)!;
    expect(next.fruit_tree['Palm Tree']!.description).toBe('The one by the well');
    expect(next.fruit_tree.Palmyra!.isDeleted).toBe(true);
  });

  it('returns null when nothing is stored under Palmyra, and is idempotent', () => {
    expect(rename(createEmptyProfiles())).toBeNull();
    expect(rename(rename(palmyra())!)).toBeNull();
  });
});

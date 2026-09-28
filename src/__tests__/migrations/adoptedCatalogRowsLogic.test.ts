import {
  ADOPTED_CATALOG_ROWS_V18,
  planAdoptedRows,
} from '@/migrations/adoptedCatalogRowsLogic';
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

const BUNDLED: Partial<Record<string, PlantProfile>> = {
  'fruit_tree:Lychee': {
    plantType: 'fruit_tree',
    name: 'Lychee',
    tamilName: 'லிச்சி',
    description: 'Evergreen tree bearing clusters of red fruit',
    varieties: ['Shahi', 'China', 'Local'],
  },
};
const bundled = (type: PlantType, name: string): PlantProfile | undefined =>
  BUNDLED[`${type}:${name}`];

/** Stand-in for the fruit-tree type defaults and generic pruning set. */
const SEED: Partial<PlantProfile> = {
  waterRequirement: 'medium',
  wateringFrequencyDays: 5,
  yearsToFirstHarvest: 4,
  growthStageDurations: { seedling: 150, vegetative: 1310 },
  pruningTips: ['Remove dead wood'],
};
const seeded = (): Partial<PlantProfile> => SEED;

/** What the add-entry form saved for a Lychee nobody edited. */
const FORM_SAVED: Partial<PlantProfile> = {
  waterRequirement: 'medium',
  wateringFrequencyDays: 5,
  yearsToFirstHarvest: 4,
  pruningTips: ['Remove dead wood'],
};

const plan = (profiles: PlantProfiles): PlantProfiles | null =>
  planAdoptedRows(profiles, ADOPTED_CATALOG_ROWS_V18, bundled, seeded);

describe('ADOPTED_CATALOG_ROWS_V18', () => {
  it('names only rows the bundled catalog offers, under their own type', () => {
    const rows = new Set(PLANT_CATALOG_ENTRIES.map((entry) => `${entry.plantType}:${entry.name}`));
    for (const [type, names] of Object.entries(ADOPTED_CATALOG_ROWS_V18)) {
      for (const name of names ?? []) {
        expect(rows.has(`${type}:${name}`)).toBe(true);
      }
    }
  });
});

describe('planAdoptedRows', () => {
  it('fills a missing Tamil name, description and varieties from the row', () => {
    const next = plan(withEntry('fruit_tree', 'Lychee', {}));
    expect(next!.fruit_tree.Lychee).toEqual(
      expect.objectContaining({
        tamilName: 'லிச்சி',
        description: 'Evergreen tree bearing clusters of red fruit',
        varieties: ['Shahi', 'China', 'Local'],
      })
    );
  });

  it('keeps the user’s own Tamil name, description and varieties', () => {
    const next = plan(
      withEntry('fruit_tree', 'Lychee', {
        tamilName: 'என் லிச்சி',
        description: 'Planted by the well',
        varieties: ['Grafted'],
        wateringFrequencyDays: 5,
      })
    );
    expect(next!.fruit_tree.Lychee).toEqual(
      expect.objectContaining({
        tamilName: 'என் லிச்சி',
        description: 'Planted by the well',
        varieties: ['Grafted'],
      })
    );
  });

  it('drops the care values the form seeded, so the row’s own show through', () => {
    const next = plan(withEntry('fruit_tree', 'Lychee', FORM_SAVED));
    const entry = next!.fruit_tree.Lychee!;
    expect(entry.yearsToFirstHarvest).toBeUndefined();
    expect(entry.wateringFrequencyDays).toBeUndefined();
    expect(entry.waterRequirement).toBeUndefined();
    expect(entry.pruningTips).toBeUndefined();
  });

  it('keeps a care value the user changed', () => {
    const next = plan(
      withEntry('fruit_tree', 'Lychee', { ...FORM_SAVED, yearsToFirstHarvest: 6, spacingCm: 700 })
    );
    const entry = next!.fruit_tree.Lychee!;
    expect(entry.yearsToFirstHarvest).toBe(6);
    expect(entry.spacingCm).toBe(700);
    expect(entry.wateringFrequencyDays).toBeUndefined();
  });

  it('compares ranges and objects by value', () => {
    const next = plan(
      withEntry('fruit_tree', 'Lychee', {
        growthStageDurations: { vegetative: 1310, seedling: 150 },
      })
    );
    expect(next!.fruit_tree.Lychee!.growthStageDurations).toBeUndefined();
  });

  it('keeps edited pruning tips as a set', () => {
    const next = plan(
      withEntry('fruit_tree', 'Lychee', { ...FORM_SAVED, pruningTips: ['Thin after harvest'] })
    );
    expect(next!.fruit_tree.Lychee!.pruningTips).toEqual(['Thin after harvest']);
  });

  it('keeps linked pests and diseases', () => {
    const next = plan(
      withEntry('fruit_tree', 'Lychee', { ...FORM_SAVED, customPests: ['fruit_borer'] })
    );
    expect(next!.fruit_tree.Lychee!.customPests).toEqual(['fruit_borer']);
  });

  it('leaves a tombstoned entry hidden', () => {
    const profiles = withEntry('fruit_tree', 'Lychee', {
      ...FORM_SAVED,
      isDeleted: true,
      isDismissed: true,
    });
    expect(plan(profiles)).toBeNull();
  });

  it('leaves the same name filed under another type alone', () => {
    expect(plan(withEntry('shrub', 'Lychee', FORM_SAVED))).toBeNull();
  });

  it('writes nothing on a second run', () => {
    const once = plan(withEntry('fruit_tree', 'Lychee', FORM_SAVED));
    expect(once).not.toBeNull();
    expect(plan(once!)).toBeNull();
  });

  it('writes nothing when the user has no entry for the new rows', () => {
    expect(plan(createEmptyProfiles())).toBeNull();
  });
});

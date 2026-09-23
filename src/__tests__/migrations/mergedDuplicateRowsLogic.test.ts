import { planFoldMerge } from '@/migrations/mergedCashewNutLogic';
import {
  MERGED_PLANT_NAMES_V17,
  MERGED_SURVIVOR_TYPE_V17,
  MERGED_VARIETY_LABELS_V17,
  plannedGardenPlantMerge,
} from '@/migrations/mergedDuplicateRowsLogic';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';
import { makePlantProfile, makePlantProfiles } from '../fixtures/plant.fixtures';

const isCatalogRow = (type: PlantType, name: string): boolean =>
  PLANT_CATALOG_ENTRIES.some((entry) => entry.plantType === type && entry.name === name);

const BRINJAL: PlantProfile = makePlantProfile({
  name: 'Brinjal',
  description: 'Curated brinjal record',
  varieties: ['Long Purple', 'Long Brinjal'],
});
const bundled = (type: PlantType, name: string): PlantProfile | undefined =>
  type === 'vegetable' && name === 'Brinjal' ? BRINJAL : undefined;

const plan = (profiles: PlantProfiles): PlantProfiles | null =>
  planFoldMerge(
    profiles,
    MERGED_PLANT_NAMES_V17,
    MERGED_SURVIVOR_TYPE_V17,
    bundled,
    1000,
    MERGED_VARIETY_LABELS_V17
  );

describe('migration 017 — duplicate rows become varieties', () => {
  it('merges only onto rows the bundled catalog has, and retires rows it no longer has', () => {
    for (const [from, to] of Object.entries(MERGED_PLANT_NAMES_V17)) {
      const type = MERGED_SURVIVOR_TYPE_V17[to]!;
      expect(isCatalogRow(type, to)).toBe(true);
      expect(PLANT_CATALOG_ENTRIES.some((entry) => entry.name === from)).toBe(false);
    }
  });

  it('gives every survivor the retired row as a variety in the bundled data', () => {
    for (const [from, to] of Object.entries(MERGED_PLANT_NAMES_V17)) {
      const label = MERGED_VARIETY_LABELS_V17[from]!;
      const row = PLANT_CATALOG_ENTRIES.find((entry) => entry.name === to);
      // Coconut lists named cultivars; its palm-type labels are free text.
      if (to === 'Coconut') continue;
      expect(row?.varieties).toContain(label);
    }
  });

  it('folds a stored Long Brinjal entry into Brinjal and tombstones it', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({
        name: 'Long Brinjal',
        varieties: ['Violet Long'],
        customPests: ['Shoot Borer'],
      }),
    ]);

    const next = plan(profiles);

    expect(next?.vegetable.Brinjal?.description).toBe('Curated brinjal record');
    expect(next?.vegetable.Brinjal?.varieties).toEqual([
      'Long Purple',
      'Long Brinjal',
      'Violet Long',
    ]);
    expect(next?.vegetable.Brinjal?.customPests).toEqual(['Shoot Borer']);
    expect(next?.vegetable['Long Brinjal']?.isDeleted).toBe(true);
    expect(plan(next!)).toBeNull();
  });

  it('adds the variety label to a survivor the user had already edited', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ name: 'Brinjal', varieties: ['Local'] }),
      makePlantProfile({ name: 'Long Brinjal' }),
    ]);

    expect(plan(profiles)?.vegetable.Brinjal?.varieties).toEqual(['Local', 'Long Brinjal']);
  });
});

describe('plannedGardenPlantMerge', () => {
  it('moves a plant onto the survivor and records what it was as its variety', () => {
    expect(plannedGardenPlantMerge({ plant_variety: 'Dwarf Coconut', variety: null })).toEqual({
      plant_variety: 'Coconut',
      plant_type: 'coconut_tree',
      variety: 'Dwarf',
    });
    expect(plannedGardenPlantMerge({ plant_variety: 'Red Banana' })).toEqual({
      plant_variety: 'Banana',
      plant_type: 'fruit_tree',
      variety: 'Red Banana',
    });
  });

  it('keeps a variety the farmer already set', () => {
    expect(
      plannedGardenPlantMerge({ plant_variety: 'Tall Coconut', variety: 'West Coast Tall' })
    ).toEqual({ plant_variety: 'Coconut', plant_type: 'coconut_tree' });
  });

  it('leaves other plants alone', () => {
    expect(plannedGardenPlantMerge({ plant_variety: 'Brinjal' })).toBeNull();
    expect(plannedGardenPlantMerge({ plant_variety: null })).toBeNull();
  });
});

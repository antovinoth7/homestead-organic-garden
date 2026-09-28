import {
  MERGED_PLANT_NAMES,
  planProfileMerge,
  plannedVarietyRename,
} from '@/migrations/mergedPlantNamesLogic';
import { makePlantProfile } from '../fixtures/plant.fixtures';
import type { PlantProfiles, PlantType } from '@/types/database.types';

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

const withVegetables = (entries: Record<string, unknown>): PlantProfiles => {
  const profiles = createEmptyProfiles();
  profiles.vegetable = entries as PlantProfiles['vegetable'];
  return profiles;
};

describe('plannedVarietyRename', () => {
  it('moves a garden plant off a merged-away name', () => {
    expect(plannedVarietyRename('Methi', MERGED_PLANT_NAMES)).toBe('Fenugreek');
    expect(plannedVarietyRename('Eggplant', MERGED_PLANT_NAMES)).toBe('Brinjal');
    expect(plannedVarietyRename('Moringa', MERGED_PLANT_NAMES)).toBe('Drumstick');
    expect(plannedVarietyRename('Colocasia', MERGED_PLANT_NAMES)).toBe('Taro');
  });

  it('leaves every other name alone', () => {
    expect(plannedVarietyRename('Tomato', MERGED_PLANT_NAMES)).toBeNull();
    expect(plannedVarietyRename('Fenugreek', MERGED_PLANT_NAMES)).toBeNull();
    expect(plannedVarietyRename('', MERGED_PLANT_NAMES)).toBeNull();
    expect(plannedVarietyRename(null, MERGED_PLANT_NAMES)).toBeNull();
  });

  it('tolerates stray whitespace on stored values', () => {
    expect(plannedVarietyRename('  Methi ', MERGED_PLANT_NAMES)).toBe('Fenugreek');
  });

  it('keeps every surviving name out of its own key set', () => {
    const kept = new Set(Object.values(MERGED_PLANT_NAMES));
    for (const removed of Object.keys(MERGED_PLANT_NAMES)) {
      expect(kept.has(removed)).toBe(false);
    }
  });
});

describe('planProfileMerge', () => {
  it('returns null when there is nothing to move', () => {
    const profiles = withVegetables({
      Tomato: makePlantProfile({ name: 'Tomato' }),
    });
    expect(planProfileMerge(profiles, MERGED_PLANT_NAMES)).toBeNull();
  });

  it("carries the user's edits across to the surviving name", () => {
    const profiles = withVegetables({
      Methi: makePlantProfile({ name: 'Methi', wateringFrequencyDays: 4 }),
    });
    const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES);

    expect(merged?.vegetable.Methi).toBeUndefined();
    expect(merged?.vegetable.Fenugreek).toMatchObject({
      name: 'Fenugreek',
      plantType: 'vegetable',
      wateringFrequencyDays: 4,
    });
  });

  it('keeps the surviving entry when both names have overrides', () => {
    const profiles = withVegetables({
      Methi: makePlantProfile({ name: 'Methi', wateringFrequencyDays: 4 }),
      Fenugreek: makePlantProfile({ name: 'Fenugreek', wateringFrequencyDays: 9 }),
    });
    const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES);

    expect(merged?.vegetable.Methi).toBeUndefined();
    expect(merged?.vegetable.Fenugreek).toMatchObject({ wateringFrequencyDays: 9 });
  });

  it('drops a tombstone on a name that no longer exists', () => {
    const profiles = withVegetables({
      Eggplant: makePlantProfile({ name: 'Eggplant', isDeleted: true }),
    });
    const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES);

    expect(merged?.vegetable.Eggplant).toBeUndefined();
    // Hiding "Eggplant" must not hide Brinjal, which is a different decision.
    expect(merged?.vegetable.Brinjal).toBeUndefined();
  });

  it('is idempotent — a second pass finds nothing left to do', () => {
    const profiles = withVegetables({
      Methi: makePlantProfile({ name: 'Methi' }),
      Moringa: makePlantProfile({ name: 'Moringa' }),
    });
    const once = planProfileMerge(profiles, MERGED_PLANT_NAMES);
    expect(once).not.toBeNull();
    expect(planProfileMerge(once as PlantProfiles, MERGED_PLANT_NAMES)).toBeNull();
  });

  it('leaves unrelated categories untouched', () => {
    const profiles = createEmptyProfiles();
    profiles.vegetable = { Methi: makePlantProfile({ name: 'Methi' }) };
    profiles.herb = { Basil: makePlantProfile({ plantType: 'herb', name: 'Basil' }) };

    const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES);
    expect(merged?.herb.Basil).toMatchObject({ name: 'Basil' });
  });
});

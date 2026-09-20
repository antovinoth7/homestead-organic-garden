import {
  RECATEGORISED_PLANTS,
  planProfileRecategorisation,
  plannedTypeChange,
} from '@/migrations/recategorisedPlantsLogic';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
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

const withShrubs = (entries: Record<string, unknown>): PlantProfiles => {
  const profiles = createEmptyProfiles();
  profiles.shrub = entries as PlantProfiles['shrub'];
  return profiles;
};

describe('plannedTypeChange', () => {
  it('moves a garden plant off the dropped category', () => {
    expect(plannedTypeChange('Hibiscus', 'shrub', RECATEGORISED_PLANTS)).toBe('flower');
    expect(plannedTypeChange('Ixora', 'shrub', RECATEGORISED_PLANTS)).toBe('flower');
    expect(plannedTypeChange('Jasmine', 'shrub', RECATEGORISED_PLANTS)).toBe('flower');
    expect(plannedTypeChange('Crossandra', 'shrub', RECATEGORISED_PLANTS)).toBe('flower');
  });

  it('moves the keerai from vegetable to spinach', () => {
    expect(plannedTypeChange('Purslane', 'vegetable', RECATEGORISED_PLANTS)).toBe('spinach');
    expect(plannedTypeChange('Amaranthus', 'vegetable', RECATEGORISED_PLANTS)).toBe('spinach');
    expect(plannedTypeChange('Pasalai Keerai', 'vegetable', RECATEGORISED_PLANTS)).toBe('spinach');
    expect(plannedTypeChange('Fenugreek', 'vegetable', RECATEGORISED_PLANTS)).toBe('spinach');
  });

  it('leaves a plant already on the surviving category alone', () => {
    expect(plannedTypeChange('Hibiscus', 'flower', RECATEGORISED_PLANTS)).toBeNull();
    expect(plannedTypeChange('Purslane', 'spinach', RECATEGORISED_PLANTS)).toBeNull();
  });

  it('leaves every other plant alone', () => {
    expect(plannedTypeChange('Bougainvillea', 'shrub', RECATEGORISED_PLANTS)).toBeNull();
    expect(plannedTypeChange('Tomato', 'vegetable', RECATEGORISED_PLANTS)).toBeNull();
    expect(plannedTypeChange('', 'shrub', RECATEGORISED_PLANTS)).toBeNull();
    expect(plannedTypeChange(null, null, RECATEGORISED_PLANTS)).toBeNull();
  });

  it('tolerates stray whitespace on stored values', () => {
    expect(plannedTypeChange('  Jasmine ', 'shrub', RECATEGORISED_PLANTS)).toBe('flower');
  });

  // The point of the migration: the name must exist under the destination
  // category and must not exist under the source one.
  it('names only plants the catalog now offers under the surviving category', () => {
    for (const [name, { from, to }] of Object.entries(RECATEGORISED_PLANTS)) {
      expect(DEFAULT_PLANT_CATALOG.categories[to].plants).toContain(name);
      expect(DEFAULT_PLANT_CATALOG.categories[from].plants).not.toContain(name);
    }
  });
});

describe('planProfileRecategorisation', () => {
  it('returns null when there is nothing to move', () => {
    const profiles = withShrubs({
      Bougainvillea: makePlantProfile({ plantType: 'shrub', name: 'Bougainvillea' }),
    });
    expect(planProfileRecategorisation(profiles, RECATEGORISED_PLANTS)).toBeNull();
  });

  it("carries the user's edits across to the surviving category", () => {
    const profiles = withShrubs({
      Hibiscus: makePlantProfile({
        plantType: 'shrub',
        name: 'Hibiscus',
        wateringFrequencyDays: 4,
      }),
    });
    const moved = planProfileRecategorisation(profiles, RECATEGORISED_PLANTS);

    expect(moved?.shrub.Hibiscus).toBeUndefined();
    expect(moved?.flower.Hibiscus).toMatchObject({
      name: 'Hibiscus',
      plantType: 'flower',
      wateringFrequencyDays: 4,
    });
  });

  it('keeps the surviving entry when both categories have overrides', () => {
    const profiles = createEmptyProfiles();
    profiles.shrub = {
      Jasmine: makePlantProfile({ plantType: 'shrub', name: 'Jasmine', wateringFrequencyDays: 4 }),
    };
    profiles.flower = {
      Jasmine: makePlantProfile({ plantType: 'flower', name: 'Jasmine', wateringFrequencyDays: 9 }),
    };
    const moved = planProfileRecategorisation(profiles, RECATEGORISED_PLANTS);

    expect(moved?.shrub.Jasmine).toBeUndefined();
    expect(moved?.flower.Jasmine).toMatchObject({ wateringFrequencyDays: 9 });
  });

  it('drops a tombstone rather than hiding the surviving row', () => {
    const profiles = withShrubs({
      Ixora: makePlantProfile({ plantType: 'shrub', name: 'Ixora', isDeleted: true }),
    });
    const moved = planProfileRecategorisation(profiles, RECATEGORISED_PLANTS);

    expect(moved?.shrub.Ixora).toBeUndefined();
    // Deleting the duplicate shrub row was never a decision to hide the flower.
    expect(moved?.flower.Ixora).toBeUndefined();
  });

  it('is idempotent — a second pass finds nothing left to do', () => {
    const profiles = withShrubs({
      Hibiscus: makePlantProfile({ plantType: 'shrub', name: 'Hibiscus' }),
      Crossandra: makePlantProfile({ plantType: 'shrub', name: 'Crossandra' }),
    });
    const once = planProfileRecategorisation(profiles, RECATEGORISED_PLANTS);
    expect(once).not.toBeNull();
    expect(planProfileRecategorisation(once as PlantProfiles, RECATEGORISED_PLANTS)).toBeNull();
  });

  it('moves a plant between two categories that are not shrub and flower', () => {
    const profiles = createEmptyProfiles();
    profiles.vegetable = {
      Purslane: makePlantProfile({ plantType: 'vegetable', name: 'Purslane' }),
    };
    const moved = planProfileRecategorisation(profiles, RECATEGORISED_PLANTS);

    expect(moved?.vegetable.Purslane).toBeUndefined();
    expect(moved?.spinach.Purslane).toMatchObject({ name: 'Purslane', plantType: 'spinach' });
  });

  it('leaves unrelated categories untouched', () => {
    const profiles = createEmptyProfiles();
    profiles.shrub = { Hibiscus: makePlantProfile({ plantType: 'shrub', name: 'Hibiscus' }) };
    profiles.herb = { Tulsi: makePlantProfile({ plantType: 'herb', name: 'Tulsi' }) };

    const moved = planProfileRecategorisation(profiles, RECATEGORISED_PLANTS);
    expect(moved?.herb.Tulsi).toMatchObject({ name: 'Tulsi' });
  });
});

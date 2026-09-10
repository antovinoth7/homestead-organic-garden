import {
  MERGED_PLANT_NAMES_V9,
  MERGED_SURVIVOR_TYPE,
  RECATEGORISED_PLANTS_V9,
  planSurvivorRelocation,
} from '@/migrations/catalogRealignmentLogic';
import { MERGED_PLANT_NAMES, planProfileMerge, plannedVarietyRename } from '@/migrations/mergedPlantNamesLogic';
import {
  RECATEGORISED_PLANTS,
  planProfileRecategorisation,
  plannedTypeChange,
} from '@/migrations/recategorisedPlantsLogic';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import { makePlantProfile, makePlantProfiles } from '../fixtures/plant.fixtures';
import type { PlantProfiles } from '@/types/database.types';

/** Every step of migration 009, in the order the migration applies them. */
const replan = (profiles: PlantProfiles): PlantProfiles | null => {
  const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES_V9);
  const homed = planSurvivorRelocation(merged ?? profiles);
  const moved = planProfileRecategorisation(homed ?? merged ?? profiles, RECATEGORISED_PLANTS_V9);
  return moved ?? homed ?? merged;
};

describe('MERGED_PLANT_NAMES_V9', () => {
  it('renames a garden plant off each dropped duplicate', () => {
    expect(plannedVarietyRename('Malabar Spinach', MERGED_PLANT_NAMES_V9)).toBe('Pasalai Keerai');
    expect(plannedVarietyRename('Amaranth Greens', MERGED_PLANT_NAMES_V9)).toBe('Amaranthus');
  });

  it('leaves the surviving name and everything else alone', () => {
    expect(plannedVarietyRename('Pasalai Keerai', MERGED_PLANT_NAMES_V9)).toBeNull();
    expect(plannedVarietyRename('Amaranthus', MERGED_PLANT_NAMES_V9)).toBeNull();
    expect(plannedVarietyRename('Tomato', MERGED_PLANT_NAMES_V9)).toBeNull();
  });

  it('drops names the catalog no longer offers, onto names it does', () => {
    const allPlants = Object.values(DEFAULT_PLANT_CATALOG.categories).flatMap((c) => c.plants);
    for (const [removed, kept] of Object.entries(MERGED_PLANT_NAMES_V9)) {
      expect(allPlants).not.toContain(removed);
      expect(allPlants).toContain(kept);
    }
  });

  // The rename only helps a user who typed the old name if search knows it too.
  it('keeps every dropped name reachable through the alias table', () => {
    for (const [removed, kept] of Object.entries(MERGED_PLANT_NAMES_V9)) {
      expect(getCanonicalPlantKey(removed)).toBe(kept.toLowerCase());
    }
  });

  it('does not overlap migration 007, whose map must stay frozen', () => {
    for (const name of Object.keys(MERGED_PLANT_NAMES_V9)) {
      expect(MERGED_PLANT_NAMES[name]).toBeUndefined();
    }
  });
});

describe('RECATEGORISED_PLANTS_V9', () => {
  it('files each row under the harvest it is cut for', () => {
    expect(plannedTypeChange('Nandiyavattai', 'shrub', RECATEGORISED_PLANTS_V9)).toBe('flower');
    expect(plannedTypeChange('Aavaram', 'shrub', RECATEGORISED_PLANTS_V9)).toBe('flower');
    expect(plannedTypeChange('Arali', 'shrub', RECATEGORISED_PLANTS_V9)).toBe('flower');
    expect(plannedTypeChange('Maruthani', 'shrub', RECATEGORISED_PLANTS_V9)).toBe('herb');
    expect(plannedTypeChange('Nochi', 'shrub', RECATEGORISED_PLANTS_V9)).toBe('herb');
    expect(plannedTypeChange('Agathi', 'shrub', RECATEGORISED_PLANTS_V9)).toBe('spinach');
  });

  it('leaves the two rows the shrub category keeps', () => {
    expect(plannedTypeChange('Bougainvillea', 'shrub', RECATEGORISED_PLANTS_V9)).toBeNull();
    expect(plannedTypeChange('Castor', 'shrub', RECATEGORISED_PLANTS_V9)).toBeNull();
  });

  it('leaves a plant already on the surviving category alone', () => {
    expect(plannedTypeChange('Agathi', 'spinach', RECATEGORISED_PLANTS_V9)).toBeNull();
    expect(plannedTypeChange('Arali', 'flower', RECATEGORISED_PLANTS_V9)).toBeNull();
  });

  it('names only plants the catalog now offers under the surviving category', () => {
    for (const [name, { from, to }] of Object.entries(RECATEGORISED_PLANTS_V9)) {
      expect(DEFAULT_PLANT_CATALOG.categories[to].plants).toContain(name);
      expect(DEFAULT_PLANT_CATALOG.categories[from].plants).not.toContain(name);
    }
  });

  it('does not overlap migration 008, whose map must stay frozen', () => {
    for (const name of Object.keys(RECATEGORISED_PLANTS_V9)) {
      expect(RECATEGORISED_PLANTS[name]).toBeUndefined();
    }
  });
});

describe('the two halves applied together', () => {
  it('renames before re-typing, so a dropped name still lands correctly', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({
        plantType: 'spinach',
        name: 'Malabar Spinach',
        wateringFrequencyDays: 2,
      }),
      makePlantProfile({ plantType: 'shrub', name: 'Agathi', wateringFrequencyDays: 7 }),
    ]);

    const next = replan(profiles);

    expect(next?.spinach['Malabar Spinach']).toBeUndefined();
    expect(next?.spinach['Pasalai Keerai']).toMatchObject({
      name: 'Pasalai Keerai',
      wateringFrequencyDays: 2,
    });
    expect(next?.shrub.Agathi).toBeUndefined();
    expect(next?.spinach.Agathi).toMatchObject({ plantType: 'spinach', wateringFrequencyDays: 7 });
  });

  it("carries the user's edits onto the new category", () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'shrub', name: 'Arali', wateringFrequencyDays: 11 }),
    ]);

    const next = replan(profiles);

    expect(next?.shrub.Arali).toBeUndefined();
    expect(next?.flower.Arali).toMatchObject({
      name: 'Arali',
      plantType: 'flower',
      wateringFrequencyDays: 11,
    });
  });

  it('drops a tombstone rather than hiding the surviving row', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'spinach', name: 'Malabar Spinach', isDeleted: true }),
    ]);

    const next = replan(profiles);

    expect(next?.spinach['Malabar Spinach']).toBeUndefined();
    // Hiding the duplicate row was never a decision to hide Pasalai Keerai.
    expect(next?.spinach['Pasalai Keerai']).toBeUndefined();
  });

  it('returns null when there is nothing to do', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'shrub', name: 'Castor' }),
    ]);
    expect(replan(profiles)).toBeNull();
  });

  it('is idempotent — a second pass finds nothing left to do', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'shrub', name: 'Nochi' }),
      makePlantProfile({ plantType: 'vegetable', name: 'Amaranth Greens' }),
    ]);

    const once = replan(profiles);
    expect(once).not.toBeNull();
    expect(replan(once as PlantProfiles)).toBeNull();
  });

  // planProfileMerge renames in place, so a user-added `Malabar Spinach` filed
  // under `vegetable` would otherwise become a `Pasalai Keerai` override on a
  // category that does not offer it — a user-added duplicate under a new name.
  it('does not strand a survivor on a category that has no such row', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({
        plantType: 'vegetable',
        name: 'Malabar Spinach',
        wateringFrequencyDays: 3,
      }),
    ]);

    const next = replan(profiles);

    expect(next?.vegetable['Malabar Spinach']).toBeUndefined();
    expect(next?.vegetable['Pasalai Keerai']).toBeUndefined();
    expect(next?.spinach['Pasalai Keerai']).toMatchObject({
      plantType: 'spinach',
      wateringFrequencyDays: 3,
    });
  });

  it('leaves a survivor already on its own category alone', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'spinach', name: 'Amaranthus' }),
    ]);
    expect(planSurvivorRelocation(profiles)).toBeNull();
  });

  it('names a real category for every survivor it relocates', () => {
    for (const [name, type] of Object.entries(MERGED_SURVIVOR_TYPE)) {
      expect(DEFAULT_PLANT_CATALOG.categories[type].plants).toContain(name);
      expect(Object.values(MERGED_PLANT_NAMES_V9)).toContain(name);
    }
  });
});

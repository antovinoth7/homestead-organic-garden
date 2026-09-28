import {
  MERGED_PLANT_NAMES_V10,
  MERGED_SURVIVOR_TYPE_V10,
  RECATEGORISED_PLANTS_V10,
} from '@/migrations/catalogRealignment010Logic';
import {
  MERGED_PLANT_NAMES_V9,
  MERGED_SURVIVOR_TYPE,
  RECATEGORISED_PLANTS_V9,
  planSurvivorRelocation,
} from '@/migrations/catalogRealignmentLogic';
import {
  MERGED_PLANT_NAMES,
  planProfileMerge,
  plannedVarietyRename,
} from '@/migrations/mergedPlantNamesLogic';
import {
  RECATEGORISED_PLANTS,
  planProfileRecategorisation,
  plannedTypeChange,
} from '@/migrations/recategorisedPlantsLogic';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
import { getCanonicalPlantKey } from '@/utils/plantAliases';
import { makePlantProfile, makePlantProfiles } from '../fixtures/plant.fixtures';
import type { PlantProfiles } from '@/types/database.types';

/** Every step of migration 010, in the order the migration applies them. */
const replan = (profiles: PlantProfiles): PlantProfiles | null => {
  const merged = planProfileMerge(profiles, MERGED_PLANT_NAMES_V10);
  const homed = planSurvivorRelocation(merged ?? profiles, MERGED_SURVIVOR_TYPE_V10);
  const moved = planProfileRecategorisation(homed ?? merged ?? profiles, RECATEGORISED_PLANTS_V10);
  return moved ?? homed ?? merged;
};

describe('MERGED_PLANT_NAMES_V10', () => {
  it('renames a garden plant off the dropped duplicate', () => {
    expect(plannedVarietyRename('Ash Plantain', MERGED_PLANT_NAMES_V10)).toBe('Banana');
  });

  it('leaves the surviving name and everything else alone', () => {
    expect(plannedVarietyRename('Banana', MERGED_PLANT_NAMES_V10)).toBeNull();
    expect(plannedVarietyRename('Red Banana', MERGED_PLANT_NAMES_V10)).toBeNull();
    expect(plannedVarietyRename('Tomato', MERGED_PLANT_NAMES_V10)).toBeNull();
  });

  it('drops names the catalog no longer offers, onto names it does', () => {
    const allPlants = Object.values(DEFAULT_PLANT_CATALOG.categories).flatMap((c) => c.plants);
    for (const [removed, kept] of Object.entries(MERGED_PLANT_NAMES_V10)) {
      expect(allPlants).not.toContain(removed);
      expect(allPlants).toContain(kept);
    }
  });

  // The rename only helps a user who typed the old name if search knows it too.
  it('keeps every dropped name reachable through the alias table', () => {
    for (const [removed, kept] of Object.entries(MERGED_PLANT_NAMES_V10)) {
      expect(getCanonicalPlantKey(removed)).toBe(kept.toLowerCase());
    }
  });

  it('does not overlap migrations 007 or 009, whose maps must stay frozen', () => {
    for (const name of Object.keys(MERGED_PLANT_NAMES_V10)) {
      expect(MERGED_PLANT_NAMES[name]).toBeUndefined();
      expect(MERGED_PLANT_NAMES_V9[name]).toBeUndefined();
    }
  });
});

describe('MERGED_SURVIVOR_TYPE_V10', () => {
  it('names a real category for every survivor it relocates', () => {
    for (const [name, type] of Object.entries(MERGED_SURVIVOR_TYPE_V10)) {
      expect(DEFAULT_PLANT_CATALOG.categories[type].plants).toContain(name);
      expect(Object.values(MERGED_PLANT_NAMES_V10)).toContain(name);
    }
  });

  it('does not overlap migration 009, whose map must stay frozen', () => {
    for (const name of Object.keys(MERGED_SURVIVOR_TYPE_V10)) {
      expect(MERGED_SURVIVOR_TYPE[name]).toBeUndefined();
    }
  });
});

describe('RECATEGORISED_PLANTS_V10', () => {
  it('files Castor under the harvest it is grown for', () => {
    expect(plannedTypeChange('Castor', 'shrub', RECATEGORISED_PLANTS_V10)).toBe('herb');
  });

  it('leaves the one row the shrub category keeps', () => {
    expect(plannedTypeChange('Bougainvillea', 'shrub', RECATEGORISED_PLANTS_V10)).toBeNull();
  });

  it('leaves a plant already on the surviving category alone', () => {
    expect(plannedTypeChange('Castor', 'herb', RECATEGORISED_PLANTS_V10)).toBeNull();
  });

  it('names only plants the catalog now offers under the surviving category', () => {
    for (const [name, { from, to }] of Object.entries(RECATEGORISED_PLANTS_V10)) {
      expect(DEFAULT_PLANT_CATALOG.categories[to].plants).toContain(name);
      expect(DEFAULT_PLANT_CATALOG.categories[from].plants).not.toContain(name);
    }
  });

  it('does not overlap migrations 008 or 009, whose maps must stay frozen', () => {
    for (const name of Object.keys(RECATEGORISED_PLANTS_V10)) {
      expect(RECATEGORISED_PLANTS[name]).toBeUndefined();
      expect(RECATEGORISED_PLANTS_V9[name]).toBeUndefined();
    }
  });
});

describe('the two halves applied together', () => {
  // This merge crosses categories, which 009's pairs never did: the override
  // has to end up under `fruit_tree`, not the `vegetable` it was stored on.
  it('carries a merged override across to the surviving category', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({
        plantType: 'vegetable',
        name: 'Ash Plantain',
        wateringFrequencyDays: 2,
      }),
    ]);

    const next = replan(profiles);

    expect(next?.vegetable['Ash Plantain']).toBeUndefined();
    expect(next?.vegetable.Banana).toBeUndefined();
    expect(next?.fruit_tree.Banana).toMatchObject({
      name: 'Banana',
      plantType: 'fruit_tree',
      wateringFrequencyDays: 2,
    });
  });

  it('re-types a stored Castor override into the herb category', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'shrub', name: 'Castor', wateringFrequencyDays: 7 }),
    ]);

    const next = replan(profiles);

    expect(next?.shrub.Castor).toBeUndefined();
    expect(next?.herb.Castor).toMatchObject({
      name: 'Castor',
      plantType: 'herb',
      wateringFrequencyDays: 7,
    });
  });

  it('lets the row that is really there win over the dropped duplicate', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'vegetable', name: 'Ash Plantain', wateringFrequencyDays: 2 }),
      makePlantProfile({ plantType: 'fruit_tree', name: 'Banana', wateringFrequencyDays: 9 }),
    ]);

    const next = replan(profiles);

    expect(next?.vegetable['Ash Plantain']).toBeUndefined();
    expect(next?.fruit_tree.Banana).toMatchObject({ wateringFrequencyDays: 9 });
  });

  it('drops a tombstone on a row the catalog no longer offers', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'vegetable', name: 'Ash Plantain', isDeleted: true }),
    ]);

    const next = replan(profiles);

    expect(next?.vegetable['Ash Plantain']).toBeUndefined();
    // Hiding the duplicate row was never a decision to hide Banana.
    expect(next?.fruit_tree.Banana).toBeUndefined();
  });

  it('returns null when there is nothing to do', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'shrub', name: 'Bougainvillea' }),
    ]);
    expect(replan(profiles)).toBeNull();
  });

  it('is idempotent - a second pass finds nothing left to do', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ plantType: 'vegetable', name: 'Ash Plantain' }),
      makePlantProfile({ plantType: 'shrub', name: 'Castor' }),
    ]);

    const once = replan(profiles);
    expect(once).not.toBeNull();
    expect(replan(once as PlantProfiles)).toBeNull();
  });
});

import {
  STALE_TAMIL_NAMES,
  STALE_TAMIL_NAMES_V17,
  planTamilNameRepair,
} from '@/migrations/staleTamilNamesLogic';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import { makePlantProfile, makePlantProfiles } from '../fixtures/plant.fixtures';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';
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

const withWaterApple = (tamilName?: string): PlantProfiles => {
  const profiles = createEmptyProfiles();
  profiles.fruit_tree = {
    'Water Apple': {
      plantType: 'fruit_tree',
      name: 'Water Apple',
      tamilName,
      description: 'Tropical evergreen tree producing crisp, mildly sweet bell-shaped fruits',
      varieties: [],
    },
  };
  return profiles;
};

describe('staleTamilNamesLogic', () => {
  describe('catalog contract', () => {
    it('names a real catalog row whose bundled Tamil name is the corrected value', () => {
      for (const [name, { type, stale, corrected }] of Object.entries(STALE_TAMIL_NAMES)) {
        const category = DEFAULT_PLANT_CATALOG.categories[type];

        expect(category.plants).toContain(name);
        expect(category.tamilNames?.[name]).toBe(corrected);
        expect(category.tamilNames?.[name]).not.toBe(stale);
      }
    });
  });

  describe('planTamilNameRepair', () => {
    it('rewrites a stored name that still holds the stale bundled value', () => {
      const repaired = planTamilNameRepair(withWaterApple('நாவல்'));

      expect(repaired).not.toBeNull();
      expect(repaired?.fruit_tree['Water Apple']?.tamilName).toBe('ஜாம்பு');
    });

    it('leaves every other field on the entry untouched', () => {
      const before = withWaterApple('நாவல்');
      const repaired = planTamilNameRepair(before);

      expect(repaired?.fruit_tree['Water Apple']).toEqual({
        ...before.fruit_tree['Water Apple'],
        tamilName: 'ஜாம்பு',
      });
    });

    it('does not clobber a name the user set themselves', () => {
      expect(planTamilNameRepair(withWaterApple('என் மரம்'))).toBeNull();
    });

    it('no-ops when the stored name is already correct', () => {
      expect(planTamilNameRepair(withWaterApple('ஜாம்பு'))).toBeNull();
    });

    it('no-ops when the entry has no Tamil name at all', () => {
      expect(planTamilNameRepair(withWaterApple(undefined))).toBeNull();
    });

    it('no-ops on a profile store that never touched the plant', () => {
      expect(planTamilNameRepair(createEmptyProfiles())).toBeNull();
    });

    it('is idempotent — a second run finds nothing left to do', () => {
      const once = planTamilNameRepair(withWaterApple('நாவல்'));

      expect(once).not.toBeNull();
      expect(planTamilNameRepair(once as PlantProfiles)).toBeNull();
    });
  });
});

describe('migration 017 — Tamil name corrections', () => {
  it('repairs a stored copy of a wrong bundled name', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ name: 'Pigeon Pea', tamilName: 'தொவரம்பருப்பு' }),
      makePlantProfile({ plantType: 'shrub', name: 'Bougainvillea', tamilName: 'பூகன்வில்லியா' }),
    ]);
    const next = planTamilNameRepair(profiles, STALE_TAMIL_NAMES_V17);
    expect(next?.vegetable['Pigeon Pea']?.tamilName).toBe('துவரை');
    expect(next?.shrub.Bougainvillea?.tamilName).toBe('காகிதப்பூ');
    expect(planTamilNameRepair(next!, STALE_TAMIL_NAMES_V17)).toBeNull();
  });

  it('leaves a Tamil name the user set themselves', () => {
    const profiles = makePlantProfiles([
      makePlantProfile({ name: 'Pigeon Pea', tamilName: 'துவரம் செடி' }),
    ]);
    expect(planTamilNameRepair(profiles, STALE_TAMIL_NAMES_V17)).toBeNull();
  });

  it('corrects the bundled catalog too, so new installs never see the old names', () => {
    for (const [name, { corrected }] of Object.entries(STALE_TAMIL_NAMES_V17)) {
      expect(PLANT_CATALOG_ENTRIES.find((entry) => entry.name === name)?.tamilName).toBe(
        corrected
      );
    }
  });
});

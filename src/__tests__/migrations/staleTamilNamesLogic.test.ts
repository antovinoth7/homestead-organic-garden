import { STALE_TAMIL_NAMES, planTamilNameRepair } from '@/migrations/staleTamilNamesLogic';
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

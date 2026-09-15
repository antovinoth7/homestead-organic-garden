import { deriveInstanceLifecycle } from '@/utils/plantHelpers';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import type { PlantLifecycle, PlantType } from '@/types/database.types';

/** What the app actually does: read the catalog profile, then derive. */
const forPlant = (variety: string, plantType: PlantType): PlantLifecycle =>
  deriveInstanceLifecycle(getPlantCareProfile(variety, plantType)?.lifecycle, plantType);

describe('deriveInstanceLifecycle', () => {
  it("lets the catalog's own lifecycle win over the plant type", () => {
    // This is the fix. The type used to be checked first, so every fruit_tree
    // came back `permanent` and the catalog's value was discarded.
    expect(deriveInstanceLifecycle('perennial', 'fruit_tree')).toBe('perennial');
    expect(deriveInstanceLifecycle('annual', 'fruit_tree')).toBe('annual');
    expect(deriveInstanceLifecycle('permanent', 'vegetable')).toBe('permanent');
    expect(deriveInstanceLifecycle('biennial', 'vegetable')).toBe('biennial');
  });

  it('falls back to the type only when the catalog says nothing', () => {
    // A plant the user added themselves has no care profile.
    expect(deriveInstanceLifecycle(undefined, 'fruit_tree')).toBe('permanent');
    expect(deriveInstanceLifecycle(undefined, 'timber_tree')).toBe('permanent');
    expect(deriveInstanceLifecycle(undefined, 'coconut_tree')).toBe('permanent');
    expect(deriveInstanceLifecycle(undefined, 'herb')).toBe('perennial');
    expect(deriveInstanceLifecycle(undefined, 'shrub')).toBe('perennial');
    expect(deriveInstanceLifecycle(undefined, 'vegetable')).toBe('annual');
    expect(deriveInstanceLifecycle(undefined, 'spinach')).toBe('annual');
    expect(deriveInstanceLifecycle(undefined, 'flower')).toBe('annual');
  });

  describe('on the real catalog', () => {
    it('makes the five non-tree fruits perennial, not permanent', () => {
      // Each is replanted or ratooned, and only `perennial` plants get the
      // recurring harvest-leaves task.
      for (const variety of ['Banana', 'Red Banana', 'Papaya', 'Pineapple', 'Passion Fruit']) {
        expect(forPlant(variety, 'fruit_tree')).toBe('perennial');
      }
    });

    it('keeps the orchard trees, timber and coconuts permanent', () => {
      for (const variety of ['Mango', 'Jackfruit', 'Amla', 'Arecanut']) {
        expect(forPlant(variety, 'fruit_tree')).toBe('permanent');
      }
      for (const variety of ['Teak', 'Neem', 'Sandalwood', 'Bamboo']) {
        expect(forPlant(variety, 'timber_tree')).toBe('permanent');
      }
      for (const variety of ['Dwarf Coconut', 'Tall Coconut', 'Hybrid Coconut', 'King Coconut']) {
        expect(forPlant(variety, 'coconut_tree')).toBe('permanent');
      }
    });

    it('distinguishes the annual herbs from the perennial ones', () => {
      for (const variety of ['Coriander', 'Basil', 'Dill', 'Ajwain']) {
        expect(forPlant(variety, 'herb')).toBe('annual');
      }
      for (const variety of ['Mint', 'Curry Leaf', 'Turmeric', 'Black Pepper']) {
        expect(forPlant(variety, 'herb')).toBe('perennial');
      }
    });

    it('resolves every bundled catalog plant from its own lifecycle, never the fallback', () => {
      // The guard: a bundled plant relying on the type fallback is a data gap,
      // and the fallback cannot tell an annual keerai from a perennial one.
      const { DEFAULT_PLANT_CATALOG } = jest.requireActual<
        typeof import('@/services/plantCatalog')
      >('@/services/plantCatalog');
      const missing: string[] = [];
      for (const [plantType, category] of Object.entries(DEFAULT_PLANT_CATALOG.categories)) {
        for (const name of category.plants) {
          if (!getPlantCareProfile(name, plantType as PlantType)?.lifecycle) {
            missing.push(`${name} [${plantType}]`);
          }
        }
      }
      expect(missing).toEqual([]);
    });
  });
});

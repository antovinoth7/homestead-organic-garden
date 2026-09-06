import {
  PLANT_NAME_ALIASES,
  getAliasesFor,
  getCanonicalPlantKey,
  isSamePlantName,
  toLookupKey,
} from '@/utils/plantAliases';
import { DEFAULT_PLANT_CATALOG } from '@/services/plantCatalog';

/** Every catalog plant name, as lookup keys. */
const catalogKeys = new Set(
  Object.values(DEFAULT_PLANT_CATALOG.categories).flatMap((category) =>
    category.plants.map(toLookupKey)
  )
);

describe('plantAliases', () => {
  describe('catalog contract', () => {
    it('every alias points at a real catalog plant', () => {
      const dangling = Object.entries(PLANT_NAME_ALIASES)
        .filter(([, canonical]) => !catalogKeys.has(canonical))
        .map(([alias, canonical]) => `${alias} -> ${canonical}`);

      expect(dangling).toEqual([]);
    });

    it('no alias is itself a catalog plant name', () => {
      const shadowed = Object.keys(PLANT_NAME_ALIASES).filter((alias) => catalogKeys.has(alias));

      expect(shadowed).toEqual([]);
    });
  });

  // Milagu (peppercorn) and milagai (chilli) are different crops one letter
  // apart, and the app carries both. Collapsing them would send a user
  // searching for pepper to a chilli entry.
  describe('milagu vs milagai', () => {
    it('resolves milagu to Black Pepper', () => {
      expect(getCanonicalPlantKey('Milagu')).toBe('black pepper');
      expect(getCanonicalPlantKey('karumilagu')).toBe('black pepper');
      expect(getCanonicalPlantKey('Kurumulaku')).toBe('black pepper');
      expect(getCanonicalPlantKey('Peppercorns')).toBe('black pepper');
      expect(getCanonicalPlantKey('Piper nigrum')).toBe('black pepper');
    });

    it('still resolves milagai to Chilli', () => {
      expect(getCanonicalPlantKey('milagai')).toBe('chilli');
    });

    it('does not treat the two as the same plant', () => {
      expect(isSamePlantName('milagu', 'milagai')).toBe(false);
      expect(isSamePlantName('milagu', 'Black Pepper')).toBe(true);
      expect(isSamePlantName('milagai', 'Chilli')).toBe(true);
    });

    it('lists the pepper aliases under Black Pepper only', () => {
      expect(getAliasesFor('Black Pepper')).toEqual(
        expect.arrayContaining(['milagu', 'kurumulaku', 'peppercorn'])
      );
      expect(getAliasesFor('Chilli')).not.toContain('milagu');
    });
  });
});

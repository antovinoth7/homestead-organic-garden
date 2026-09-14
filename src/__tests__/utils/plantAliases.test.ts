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

  describe('rows that absorbed a duplicate', () => {
    it('resolves the dropped Malabar Spinach name to Pasalai Keerai', () => {
      expect(getCanonicalPlantKey('Malabar Spinach')).toBe('pasalai keerai');
      expect(getCanonicalPlantKey('Basella alba')).toBe('pasalai keerai');
      expect(isSamePlantName('Malabar Spinach', 'Pasalai Keerai')).toBe(true);
    });

    it('resolves the dropped Amaranth Greens name to Amaranthus', () => {
      expect(getCanonicalPlantKey('Amaranth Greens')).toBe('amaranthus');
      expect(getCanonicalPlantKey('Amaranth')).toBe('amaranthus');
      expect(isSamePlantName('Amaranth Greens', 'Amaranthus')).toBe(true);
    });

    it('keeps the Amaranthus variety names searchable as the plant', () => {
      expect(getCanonicalPlantKey('Arai Keerai')).toBe('amaranthus');
      expect(getCanonicalPlantKey('Siru Keerai')).toBe('amaranthus');
    });
  });

  describe('rows a farmer searches for by their harvest', () => {
    it('resolves agathi keerai to the Agathi row', () => {
      expect(getCanonicalPlantKey('Agathi Keerai')).toBe('agathi');
      expect(getCanonicalPlantKey('Sesbania grandiflora')).toBe('agathi');
    });

    it('resolves the flower spellings of the moved shrubs', () => {
      expect(getCanonicalPlantKey('aavarampoo')).toBe('aavaram');
      expect(getCanonicalPlantKey('Avaram Poo')).toBe('aavaram');
      expect(getCanonicalPlantKey('Arali Poo')).toBe('arali');
      expect(getCanonicalPlantKey('Crape Jasmine')).toBe('nandiyavattai');
    });

    // Nandiyavattai is crape jasmine, but it is not Jasmine — different row,
    // different crop, and malli is the one that gets sold by the kilo.
    it('does not collapse crape jasmine into Jasmine', () => {
      expect(isSamePlantName('Crape Jasmine', 'Jasmine')).toBe(false);
      expect(getCanonicalPlantKey('malli')).toBe('jasmine');
    });
  });
});

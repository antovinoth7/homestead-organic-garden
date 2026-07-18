/// <reference types="jest" />
import {
  calculateExpectedHarvestDate,
  getDefaultHarvestSeason,
  getCommonPests,
  getCommonDiseases,
  getDefaultGroupedPests,
  getDefaultGroupedDiseases,
} from '../../utils/plantHelpers';

describe('plantHelpers A2 enrichment', () => {
  describe('calculateExpectedHarvestDate', () => {
    it('returns a harvest date for a known vegetable', () => {
      const result = calculateExpectedHarvestDate('Tomato', '2024-01-15', 'vegetable');
      expect(result).toBeTruthy();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns a harvest date for a fruit tree using yearsToFirstHarvest', () => {
      const result = calculateExpectedHarvestDate('Mango', '2024-01-01', 'fruit_tree');
      expect(result).toBeTruthy();
      // Mango is ~5 years, so should be around 2029
      const year = parseInt(result!.split('-')[0]!, 10);
      expect(year).toBeGreaterThanOrEqual(2028);
    });

    it('returns a harvest date for a coconut tree', () => {
      const result = calculateExpectedHarvestDate('Dwarf Coconut', '2024-01-01', 'coconut_tree');
      expect(result).toBeTruthy();
    });

    it('returns null for unknown plant', () => {
      const result = calculateExpectedHarvestDate('UnknownPlant', '2024-01-15', 'vegetable');
      expect(result).toBeNull();
    });

    it('returns null for null inputs', () => {
      expect(calculateExpectedHarvestDate(null, '2024-01-15', 'vegetable')).toBeNull();
      expect(calculateExpectedHarvestDate('Tomato', null, 'vegetable')).toBeNull();
      expect(calculateExpectedHarvestDate('Tomato', '2024-01-15', null)).toBeNull();
    });

    it('returns null for invalid date', () => {
      expect(calculateExpectedHarvestDate('Tomato', 'not-a-date', 'vegetable')).toBeNull();
    });
  });

  describe('getDefaultHarvestSeason', () => {
    it('returns growingSeason from care profile for known plant', () => {
      const season = getDefaultHarvestSeason('Tomato', 'vegetable');
      expect(season).toBeTruthy();
      expect(typeof season).toBe('string');
    });

    it('returns type-level fallback for unknown plant', () => {
      const season = getDefaultHarvestSeason('UnknownVeg', 'vegetable');
      expect(season).toBe('Year Round');
    });

    it('returns Summer (Mar-May) fallback for fruit_tree type', () => {
      const season = getDefaultHarvestSeason('UnknownTree', 'fruit_tree');
      expect(season).toBe('Summer (Mar-May)');
    });

    it('returns null for null plantType', () => {
      expect(getDefaultHarvestSeason('Tomato', null)).toBeNull();
    });
  });

  describe('getCommonPests', () => {
    it('returns pests for vegetable type', () => {
      const pests = getCommonPests('vegetable');
      expect(pests.length).toBeGreaterThan(0);
    });

    it('returns crop-specific pests for known variety', () => {
      const pests = getCommonPests('vegetable', 'Tomato');
      expect(pests).toContain('Fruit Borer');
    });

    it('returns empty for null type', () => {
      expect(getCommonPests(null)).toEqual([]);
    });
  });

  describe('getCommonDiseases', () => {
    it('returns diseases for vegetable type', () => {
      const diseases = getCommonDiseases('vegetable');
      expect(diseases.length).toBeGreaterThan(0);
    });

    it('returns crop-specific diseases for known variety', () => {
      const diseases = getCommonDiseases('vegetable', 'Tomato');
      expect(diseases).toContain('Early Blight');
    });

    it('returns empty for null type', () => {
      expect(getCommonDiseases(null)).toEqual([]);
    });
  });

  describe('getDefaultGroupedPests', () => {
    it('returns non-empty grouped generic pests', () => {
      const groups = getDefaultGroupedPests();
      expect(groups.length).toBeGreaterThan(0);
    });

    it('includes the expected categories', () => {
      const categories = getDefaultGroupedPests().map((g) => g.category);
      expect(categories).toEqual(
        expect.arrayContaining(['Sap-Sucking', 'Borers & Larvae', 'Mites & Spiders'])
      );
    });

    it('includes known common pests', () => {
      const items = getDefaultGroupedPests().flatMap((g) => g.items);
      expect(items).toEqual(expect.arrayContaining(['Aphids', 'Leaf Miner', 'Mites']));
    });
  });

  describe('getDefaultGroupedDiseases', () => {
    it('returns non-empty grouped generic diseases', () => {
      const groups = getDefaultGroupedDiseases();
      expect(groups.length).toBeGreaterThan(0);
    });

    it('includes known common diseases', () => {
      const items = getDefaultGroupedDiseases().flatMap((g) => g.items);
      expect(items).toEqual(expect.arrayContaining(['Leaf Spot', 'Powdery Mildew', 'Root Rot']));
    });
  });
});

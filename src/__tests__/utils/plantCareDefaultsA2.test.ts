/// <reference types="jest" />
import { getPlantCareProfile, hasPlantCareProfile } from '../../utils/plantCareDefaults';
import { BOTANICAL_IDENTITY_OVERRIDES } from '../../utils/plantCareDefaults/overrides/botanicalIdentity';
import { TAMIL_NADU_AGRONOMY_GAP_OVERRIDES } from '../../utils/plantCareDefaults/overrides/tamilNaduAgronomyGaps';
import type { PlantType } from '../../types/database.types';

describe('plantCareDefaults A2 enrichment', () => {
  describe('enriched profiles', () => {
    it('Tomato has all A2 fields', () => {
      const profile = getPlantCareProfile('Tomato', 'vegetable');
      expect(profile).toBeTruthy();
      expect(profile!.scientificName).toBe('Solanum lycopersicum');
      expect(profile!.taxonomicFamily).toBeTruthy();
      expect(profile!.lifecycle).toBe('annual');
      expect(profile!.tamilName).toBeTruthy();
      expect(profile!.description).toBeTruthy();
      expect(profile!.daysToHarvest).toEqual(
        expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) })
      );
      expect(profile!.heightCm).toBeTruthy();
      expect(profile!.spacingCm).toBeGreaterThan(0);
      expect(profile!.growingSeason).toBeTruthy();
      expect(profile!.heatTolerance).toBeTruthy();
      expect(profile!.droughtTolerance).toBeTruthy();
      expect(profile!.waterloggingTolerance).toBeTruthy();
      expect(profile!.feedingIntensity).toBeTruthy();
    });

    it('Mango has yearsToFirstHarvest', () => {
      const profile = getPlantCareProfile('Mango', 'fruit_tree');
      expect(profile).toBeTruthy();
      expect(profile!.yearsToFirstHarvest).toBeGreaterThan(0);
      expect(profile!.scientificName).toBe('Mangifera indica');
    });

    it('Dwarf Coconut has A2 fields', () => {
      const profile = getPlantCareProfile('Dwarf Coconut', 'coconut_tree');
      expect(profile).toBeTruthy();
      expect(profile!.yearsToFirstHarvest).toBeGreaterThan(0);
      expect(profile!.tamilName).toBeTruthy();
    });

    it('all 100 plants have profiles', () => {
      const plants: [string, string][] = [
        ['Brinjal', 'vegetable'],
        ['Coriander', 'herb'],
        ['Marigold', 'flower'],
        ['Banana', 'fruit_tree'],
        ['Neem', 'timber_tree'],
        ['Tall Coconut', 'coconut_tree'],
        ['Hibiscus', 'shrub'],
      ];

      for (const [variety, type] of plants) {
        expect(
          hasPlantCareProfile(variety, type as Parameters<typeof hasPlantCareProfile>[1])
        ).toBe(true);
      }
    });
  });

  describe('NumericRange fields', () => {
    it('daysToHarvest has min <= max', () => {
      const profile = getPlantCareProfile('Ladies Finger', 'vegetable');
      expect(profile!.daysToHarvest!.min).toBeLessThanOrEqual(profile!.daysToHarvest!.max);
    });

    it('soilPhRange has valid values', () => {
      const profile = getPlantCareProfile('Tomato', 'vegetable');
      expect(profile!.soilPhRange!.min).toBeGreaterThan(0);
      expect(profile!.soilPhRange!.max).toBeLessThan(14);
    });
  });

  /**
   * These nine carried botanical identity and nothing else, so they fell through
   * to bare type defaults and browsed as "Annual · Annual" — the catalog row's
   * meta line falls back to the lifecycle label when `daysToHarvest` is absent.
   * The agronomy now lives in `tamilNaduAgronomyGaps.ts`, merged *under* the
   * identity fields, so both halves have to survive.
   */
  describe('Tamil Nadu agronomy gaps', () => {
    const ENRICHED: ReadonlyArray<[string, PlantType]> = [
      ['Knol Khol', 'vegetable'],
      ['Lablab Bean', 'vegetable'],
      ['Winged Bean', 'vegetable'],
      ['Sword Bean', 'vegetable'],
      ['Water Spinach', 'spinach'],
      ['Ponnanganni Keerai', 'spinach'],
      ['Vallarai Keerai', 'spinach'],
      ['Manathakkali Keerai', 'spinach'],
      ['Mustard Greens', 'spinach'],
    ];

    it.each(ENRICHED)('%s resolves a harvest window', (name, type) => {
      const profile = getPlantCareProfile(name, type);
      expect(profile).toBeTruthy();
      expect(profile!.daysToHarvest).toBeTruthy();
      expect(profile!.daysToHarvest!.min).toBeGreaterThan(0);
      expect(profile!.daysToHarvest!.min).toBeLessThanOrEqual(profile!.daysToHarvest!.max);
    });

    it.each(ENRICHED)('%s keeps its botanical identity on top of the agronomy', (name, type) => {
      const profile = getPlantCareProfile(name, type);
      expect(profile!.scientificName).toBeTruthy();
      expect(profile!.taxonomicFamily).toBeTruthy();
      expect(profile!.lifecycle).toBeTruthy();
    });

    // The two files have to stay in step: an identity-only plant with no
    // agronomy shard is exactly the bug this pass fixed, so a tenth one added
    // to `botanicalIdentity.ts` should name its own gap here rather than ship
    // browsing as "Annual · Annual".
    it('every identity-only plant has an agronomy entry', () => {
      expect(Object.keys(BOTANICAL_IDENTITY_OVERRIDES).sort()).toEqual(
        Object.keys(TAMIL_NADU_AGRONOMY_GAP_OVERRIDES).sort()
      );
    });

    // The Tamil name is carried by the catalog entry, not by the agronomy
    // shard — migration 011 exists because a second copy drifted from the first.
    it('takes no second copy of the Tamil name', () => {
      for (const profile of Object.values(TAMIL_NADU_AGRONOMY_GAP_OVERRIDES)) {
        expect(profile.tamilName).toBeUndefined();
      }
    });
  });
});

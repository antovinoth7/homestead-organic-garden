/// <reference types="jest" />
import {
  getCurrentSeason,
  getSeasonLabel,
  getWateringFrequencyMultiplier,
} from '../../utils/seasonHelpers';
import { HIGH_RAINFALL_ZONE } from '../../config/zones/highRainfall';
import { resolveActiveZone, setActiveZone } from '../../config/zones';
import { AgroClimaticZone } from '../../config/zones/types';

describe('seasonHelpers', () => {
  describe('getCurrentSeason', () => {
    it('returns summer for March', () => {
      expect(getCurrentSeason(new Date(2026, 2, 15))).toBe('summer');
    });

    it('returns summer for May', () => {
      expect(getCurrentSeason(new Date(2026, 4, 1))).toBe('summer');
    });

    it('returns sw_monsoon for June', () => {
      expect(getCurrentSeason(new Date(2026, 5, 1))).toBe('sw_monsoon');
    });

    it('returns sw_monsoon for September', () => {
      expect(getCurrentSeason(new Date(2026, 8, 30))).toBe('sw_monsoon');
    });

    it('returns ne_monsoon for October', () => {
      expect(getCurrentSeason(new Date(2026, 9, 1))).toBe('ne_monsoon');
    });

    it('returns ne_monsoon for December', () => {
      expect(getCurrentSeason(new Date(2026, 11, 25))).toBe('ne_monsoon');
    });

    it('returns cool_dry for January', () => {
      expect(getCurrentSeason(new Date(2026, 0, 15))).toBe('cool_dry');
    });

    it('returns cool_dry for February', () => {
      expect(getCurrentSeason(new Date(2026, 1, 28))).toBe('cool_dry');
    });

    it('accepts an explicit zone parameter', () => {
      const result = getCurrentSeason(new Date(2026, 0, 15), HIGH_RAINFALL_ZONE);
      expect(result).toBe('cool_dry');
    });

    it('defaults to high rainfall zone when no zone given', () => {
      const withZone = getCurrentSeason(new Date(2026, 6, 1), HIGH_RAINFALL_ZONE);
      const withoutZone = getCurrentSeason(new Date(2026, 6, 1));
      expect(withZone).toBe(withoutZone);
    });
  });

  describe('getSeasonLabel', () => {
    it('returns the IMD pre-monsoon label for March to May', () => {
      const label = getSeasonLabel(new Date(2026, 3, 1));
      expect(label).toContain('Pre-monsoon');
      expect(label).toContain('Mar');
    });

    it('returns label for NE monsoon', () => {
      const label = getSeasonLabel(new Date(2026, 10, 1));
      expect(label).toContain('NE Monsoon');
    });
  });

  describe('getWateringFrequencyMultiplier', () => {
    it('returns < 1 for pot plants in summer (more frequent watering)', () => {
      jest.useFakeTimers({ now: new Date(2026, 3, 15) });
      const multiplier = getWateringFrequencyMultiplier('pot');
      expect(multiplier).toBeLessThan(1);
      jest.useRealTimers();
    });

    it('returns > 1 for ground plants in NE monsoon (less frequent)', () => {
      jest.useFakeTimers({ now: new Date(2026, 10, 15) });
      const multiplier = getWateringFrequencyMultiplier('ground');
      expect(multiplier).toBeGreaterThan(1);
      jest.useRealTimers();
    });

    it('returns 1.0 for cool dry season', () => {
      jest.useFakeTimers({ now: new Date(2026, 0, 15) });
      const multiplier = getWateringFrequencyMultiplier('bed');
      expect(multiplier).toBe(1.0);
      jest.useRealTimers();
    });

    describe('with a farm zone primed', () => {
      // NE monsoon, when the zones disagree most: Kanyakumari triples the gap
      // between waterings because the rain does the work; an inland district
      // gets no such rain and must not inherit that assumption.
      beforeEach(() => jest.useFakeTimers({ now: new Date(2026, 10, 15) }));
      afterEach(() => {
        setActiveZone(null);
        jest.useRealTimers();
      });

      it('does not apply Kanyakumari rainfall scaling to an inland district', () => {
        setActiveZone(resolveActiveZone({ district: 'Coimbatore' }));
        expect(getWateringFrequencyMultiplier('ground')).toBe(1.0);
      });

      it('still applies the reviewed scaling for Kanyakumari itself', () => {
        setActiveZone(resolveActiveZone({ district: 'Kanyakumari' }));
        expect(getWateringFrequencyMultiplier('ground')).toBe(3.0);
      });

      it('falls back to the legacy default when the district was never set', () => {
        setActiveZone(resolveActiveZone({}));
        expect(getWateringFrequencyMultiplier('ground')).toBe(3.0);
      });

      it('lets an explicit zone argument win over the primed zone', () => {
        setActiveZone(resolveActiveZone({ district: 'Coimbatore' }));
        expect(getWateringFrequencyMultiplier('ground', HIGH_RAINFALL_ZONE)).toBe(3.0);
      });
    });
  });

  describe('custom zone support', () => {
    const twoSeasonZone: AgroClimaticZone = {
      id: 'test_zone',
      name: 'Test Zone',
      districts: ['TestDistrict'],
      annualRainfallMm: 800,
      soilTypes: ['clay'],
      irrigationDominant: 'canal',
      seasons: [
        { id: 'wet', name: 'Wet', label: 'Wet (Jun\u2013Nov)', startMonth: 6, endMonth: 11 },
        { id: 'dry', name: 'Dry', label: 'Dry (Dec\u2013May)', startMonth: 12, endMonth: 5 },
      ],
      wateringMultipliers: {
        wet: { pot: 1.5, bed: 3.0, ground: 3.0 },
        dry: { pot: 0.5, bed: 0.7, ground: 0.7 },
      },
    };

    it('resolves season for a zone with wrap-around months', () => {
      expect(getCurrentSeason(new Date(2026, 0, 15), twoSeasonZone)).toBe('dry');
      expect(getCurrentSeason(new Date(2026, 7, 15), twoSeasonZone)).toBe('wet');
    });

    it('returns correct watering multiplier for custom zone', () => {
      jest.useFakeTimers({ now: new Date(2026, 7, 15) });
      const multiplier = getWateringFrequencyMultiplier('pot', twoSeasonZone);
      expect(multiplier).toBe(1.5);
      jest.useRealTimers();
    });
  });
});

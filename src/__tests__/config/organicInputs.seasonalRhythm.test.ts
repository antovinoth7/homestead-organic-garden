import {
  getFrequencyForSeason,
  getSeasonalCareRhythm,
} from '@/config/organicInputs/seasonalAdaptations';

describe('seasonal care rhythm', () => {
  describe('getFrequencyForSeason', () => {
    it('returns the matching frequency row', () => {
      const summer = getFrequencyForSeason('summer');
      expect(summer?.waterDays).toBe(2);
      expect(summer?.jeevamruthaDays).toBe(10);
    });

    it('returns undefined for an unknown season id', () => {
      expect(getFrequencyForSeason('not_a_season')).toBeUndefined();
    });
  });

  describe('getSeasonalCareRhythm', () => {
    it('resolves summer (Mar–May) to the rain-free cadence', () => {
      const rhythm = getSeasonalCareRhythm(new Date(2026, 3, 15)); // April
      expect(rhythm?.seasonId).toBe('summer');
      expect(rhythm?.waterInterval).toBe('Every 2 days');
    });

    it('resolves SW monsoon (Jun–Sep) to rain-fed watering', () => {
      const rhythm = getSeasonalCareRhythm(new Date(2026, 6, 1)); // July
      expect(rhythm?.seasonId).toBe('sw_monsoon');
      expect(rhythm?.waterDays).toBe(0);
    });

    it('resolves NE monsoon (Oct–Dec)', () => {
      const rhythm = getSeasonalCareRhythm(new Date(2026, 10, 15)); // November
      expect(rhythm?.seasonId).toBe('ne_monsoon');
      expect(rhythm?.waterDays).toBe(3);
    });

    it('resolves the cool-dry window (Jan–Feb)', () => {
      const rhythm = getSeasonalCareRhythm(new Date(2026, 0, 20)); // January
      expect(rhythm?.seasonId).toBe('cool_dry');
      expect(rhythm?.mulchDays).toBe(30);
    });
  });
});

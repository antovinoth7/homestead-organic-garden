/// <reference types="jest" />
import {
  getCurrentRisk,
  getPeakRisk,
  getRiskColor,
  getSeasonLabelById,
  getSeasonNameById,
  getSeasonRiskBars,
} from '../../utils/riskHelpers';
import { lightTheme } from '../../theme/colors';
import type { SeasonalRisk } from '../../utils/riskHelpers';

// Default zone (Kanyakumari / high rainfall) seasons:
// summer Mar–May · sw_monsoon Jun–Sep · ne_monsoon Oct–Dec · cool_dry Jan–Feb
const APRIL = new Date(2026, 3, 15); // summer
const JULY = new Date(2026, 6, 15); // sw_monsoon
const JANUARY = new Date(2026, 0, 15); // cool_dry

const SAMPLE: SeasonalRisk = {
  summer: 'high',
  sw_monsoon: 'low',
  cool_dry: 'moderate',
};

describe('getRiskColor', () => {
  it('maps each level to a distinct theme token pair', () => {
    expect(getRiskColor('high', lightTheme)).toEqual({
      bg: lightTheme.errorLight,
      text: lightTheme.error,
    });
    expect(getRiskColor('moderate', lightTheme)).toEqual({
      bg: lightTheme.warningLight,
      text: lightTheme.warning,
    });
    expect(getRiskColor('low', lightTheme)).toEqual({
      bg: lightTheme.primaryLight,
      text: lightTheme.primary,
    });
  });
});

describe('getCurrentRisk', () => {
  it('reads the risk recorded for the season the date falls in', () => {
    expect(getCurrentRisk(SAMPLE, APRIL)).toBe('high');
    expect(getCurrentRisk(SAMPLE, JULY)).toBe('low');
    expect(getCurrentRisk(SAMPLE, JANUARY)).toBe('moderate');
  });

  it('returns undefined when the season has no recorded risk', () => {
    // ne_monsoon is absent from SAMPLE
    expect(getCurrentRisk(SAMPLE, new Date(2026, 10, 5))).toBeUndefined();
  });

  it('returns undefined when the entry records no seasonal risk at all', () => {
    expect(getCurrentRisk(undefined, APRIL)).toBeUndefined();
    expect(getCurrentRisk({}, APRIL)).toBeUndefined();
  });
});

describe('getSeasonRiskBars', () => {
  it('returns one bar per zone season in calendar order', () => {
    const bars = getSeasonRiskBars(SAMPLE, APRIL);
    expect(bars.map((b) => b.seasonId)).toEqual([
      'summer',
      'sw_monsoon',
      'ne_monsoon',
      'cool_dry',
    ]);
    expect(bars.map((b) => b.monthLabel)).toEqual(['MAR', 'JUN', 'OCT', 'JAN']);
  });

  it('leaves the level undefined for seasons with no recorded risk', () => {
    const bars = getSeasonRiskBars(SAMPLE, APRIL);
    expect(bars.map((b) => b.level)).toEqual(['high', 'low', undefined, 'moderate']);
  });

  it('flags exactly one bar as the current season', () => {
    const bars = getSeasonRiskBars(SAMPLE, JULY);
    expect(bars.filter((b) => b.isCurrent)).toHaveLength(1);
    expect(bars.find((b) => b.isCurrent)?.seasonId).toBe('sw_monsoon');
  });

  it('still renders every season when the entry has no risk data', () => {
    const bars = getSeasonRiskBars(undefined, APRIL);
    expect(bars).toHaveLength(4);
    expect(bars.every((b) => b.level === undefined)).toBe(true);
  });
});

describe('getPeakRisk', () => {
  it('returns the highest level present', () => {
    expect(getPeakRisk(SAMPLE)).toBe('high');
    expect(getPeakRisk({ sw_monsoon: 'low', cool_dry: 'moderate' })).toBe('moderate');
    expect(getPeakRisk({ cool_dry: 'low' })).toBe('low');
  });

  it('returns undefined with no data', () => {
    expect(getPeakRisk(undefined)).toBeUndefined();
    expect(getPeakRisk({})).toBeUndefined();
  });
});

describe('season id lookups', () => {
  it('resolves labels and names from the zone definition', () => {
    expect(getSeasonLabelById('summer')).toBe('Summer (Mar–May)');
    expect(getSeasonNameById('sw_monsoon')).toBe('SW Monsoon');
  });

  it('falls back to the raw id when unknown', () => {
    expect(getSeasonLabelById('not_a_season')).toBe('not_a_season');
    expect(getSeasonNameById('not_a_season')).toBe('not_a_season');
  });
});

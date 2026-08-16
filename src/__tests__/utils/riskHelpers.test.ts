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
import { HIGH_RAINFALL_ZONE } from '../../config/zones/highRainfall';
import type { AgroClimaticZone } from '../../config/zones/types';
import type { SeasonalRisk } from '../../utils/riskHelpers';

// Default zone (Kanyakumari / high rainfall) seasons:
// summer Mar–May · sw_monsoon Jun–Sep · ne_monsoon Oct–Dec · cool_dry Jan–Feb
const APRIL = new Date(2026, 3, 15); // summer
const JULY = new Date(2026, 6, 15); // sw_monsoon
const JANUARY = new Date(2026, 0, 15); // cool_dry

/** Two-season zone where the second season wraps past December. */
const WRAPPING_ZONE: AgroClimaticZone = {
  ...HIGH_RAINFALL_ZONE,
  seasons: [
    { id: 'wet', name: 'Wet', label: 'Wet (Mar–Oct)', startMonth: 3, endMonth: 10 },
    { id: 'dry', name: 'Dry', label: 'Dry (Nov–Feb)', startMonth: 11, endMonth: 2 },
  ],
};

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
      'cool_dry',
      'summer',
      'sw_monsoon',
      'ne_monsoon',
    ]);
    expect(bars.map((b) => b.monthLabel)).toEqual([
      'JAN–FEB',
      'MAR–MAY',
      'JUN–SEP',
      'OCT–DEC',
    ]);
  });

  it('reports each season length so bars can be sized proportionally', () => {
    const bars = getSeasonRiskBars(SAMPLE, APRIL);
    expect(bars.map((b) => b.monthCount)).toEqual([2, 3, 4, 3]);
    expect(bars.reduce((sum, b) => sum + b.monthCount, 0)).toBe(12);
  });

  it('handles a season that wraps past December', () => {
    const bars = getSeasonRiskBars(undefined, APRIL, WRAPPING_ZONE);
    expect(bars.map((b) => b.monthLabel)).toEqual(['MAR–OCT', 'NOV–FEB']);
    expect(bars.map((b) => b.monthCount)).toEqual([8, 4]);
  });

  it('leaves the level undefined for seasons with no recorded risk', () => {
    const bars = getSeasonRiskBars(SAMPLE, APRIL);
    expect(bars.map((b) => b.level)).toEqual(['moderate', 'high', 'low', undefined]);
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
    expect(getSeasonLabelById('summer')).toBe('Pre-monsoon (Mar–May)');
    expect(getSeasonNameById('sw_monsoon')).toBe('SW Monsoon');
  });

  it('falls back to the raw id when unknown', () => {
    expect(getSeasonLabelById('not_a_season')).toBe('not_a_season');
    expect(getSeasonNameById('not_a_season')).toBe('not_a_season');
  });
});

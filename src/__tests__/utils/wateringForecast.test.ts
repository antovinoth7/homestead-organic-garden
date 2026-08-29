/// <reference types="jest" />
import {
  dampWateringMultiplier,
  MIN_WATERING_MULTIPLIER,
  MAX_WATERING_MULTIPLIER,
} from '@/utils/wateringForecast';
import { makeDailyWeather, makeWeatherForecast } from '../fixtures/today.fixtures';

// Noon on 1 Nov 2026 in the farm timezone. The window this drives starts at the
// 2nd, so the fixtures below begin there.
const NOW = new Date('2026-11-01T06:30:00.000Z');

/** `count` consecutive days from 2 Nov 2026, each with the same rainfall. */
function week(precipitationMm: number, count = 7): ReturnType<typeof makeWeatherForecast> {
  const days = Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.UTC(2026, 10, 2 + i));
    return makeDailyWeather({
      date: date.toISOString().slice(0, 10),
      precipitationMm,
    });
  });
  return makeWeatherForecast(days);
}

describe('dampWateringMultiplier', () => {
  describe('when the forecast cannot speak to the question', () => {
    it('returns the season prior unchanged with no forecast at all', () => {
      expect(dampWateringMultiplier(3, 3, null, NOW)).toEqual({
        multiplier: 3,
        adjustment: null,
      });
    });

    it('returns the prior unchanged when the window lies beyond the forecast', () => {
      // Forecast covers Nov, the plant is being watered the following March.
      const result = dampWateringMultiplier(3, 3, week(0), new Date('2027-03-01T06:30:00.000Z'));
      expect(result).toEqual({ multiplier: 3, adjustment: null });
    });

    it('treats an empty forecast as no data rather than as no rain', () => {
      expect(dampWateringMultiplier(3, 3, makeWeatherForecast([]), NOW).adjustment).toBeNull();
    });
  });

  describe('dry correction', () => {
    it('halves a monsoon prior towards 1.0 when no rain is coming', () => {
      // NE monsoon ground: the season assumes 3x, the week is bone dry.
      expect(dampWateringMultiplier(3, 3, week(0), NOW)).toEqual({
        multiplier: 1.5,
        adjustment: 'dry',
      });
    });

    it('never drops below 1.0 — the soil is still seasonally wet', () => {
      const { multiplier } = dampWateringMultiplier(1.2, 3, week(0), NOW);
      expect(multiplier).toBe(1);
    });

    it('does not fire when the season already expects dry weather', () => {
      expect(dampWateringMultiplier(0.6, 3, week(0), NOW)).toEqual({
        multiplier: 0.6,
        adjustment: null,
      });
    });

    it('does not fire on drizzle at or above the dry-day threshold', () => {
      expect(dampWateringMultiplier(3, 3, week(1), NOW).adjustment).toBeNull();
    });
  });

  describe('wet correction', () => {
    it('extends a dry-season prior when real rain is forecast', () => {
      // Summer ground: the season assumes 0.6x, but showers are coming.
      expect(dampWateringMultiplier(0.6, 3, week(5), NOW)).toEqual({
        multiplier: 1.2,
        adjustment: 'rain',
      });
    });

    it('fires on a single wet day inside the window', () => {
      const days = [
        makeDailyWeather({ date: '2026-11-02', precipitationMm: 0 }),
        makeDailyWeather({ date: '2026-11-03', precipitationMm: 12 }),
        makeDailyWeather({ date: '2026-11-04', precipitationMm: 0 }),
      ];
      expect(dampWateringMultiplier(1, 3, makeWeatherForecast(days), NOW).adjustment).toBe('rain');
    });

    it('ignores rain below the showers threshold', () => {
      expect(dampWateringMultiplier(1, 3, week(1.5), NOW).adjustment).toBeNull();
    });

    it('does not fire when the season already expects the rain', () => {
      expect(dampWateringMultiplier(2.5, 3, week(8), NOW)).toEqual({
        multiplier: 2.5,
        adjustment: null,
      });
    });
  });

  describe('bounds', () => {
    it('clamps the result into the range the zone configs span', () => {
      const high = dampWateringMultiplier(99, 3, week(0), NOW).multiplier;
      const low = dampWateringMultiplier(0.01, 3, week(5), NOW).multiplier;
      for (const value of [high, low]) {
        expect(value).toBeGreaterThanOrEqual(MIN_WATERING_MULTIPLIER);
        expect(value).toBeLessThanOrEqual(MAX_WATERING_MULTIPLIER);
      }
    });

    it('falls back to a neutral prior on a nonsensical multiplier', () => {
      expect(dampWateringMultiplier(Number.NaN, 3, null, NOW).multiplier).toBe(1);
      expect(dampWateringMultiplier(-2, 3, null, NOW).multiplier).toBe(1);
    });

    it('returns the prior untouched for an invalid base interval', () => {
      expect(dampWateringMultiplier(3, 0, week(0), NOW)).toEqual({
        multiplier: 3,
        adjustment: null,
      });
      expect(dampWateringMultiplier(3, Number.NaN, week(0), NOW).adjustment).toBeNull();
    });
  });

  it('excludes today — only rain before the next watering matters', () => {
    // Heavy rain today, nothing after. The plant is being watered right now, so
    // today's rain has already had whatever effect it is going to have.
    const days = [
      makeDailyWeather({ date: '2026-11-01', precipitationMm: 40 }),
      makeDailyWeather({ date: '2026-11-02', precipitationMm: 0 }),
      makeDailyWeather({ date: '2026-11-03', precipitationMm: 0 }),
    ];
    expect(dampWateringMultiplier(1, 3, makeWeatherForecast(days), NOW).adjustment).not.toBe(
      'rain'
    );
  });
});

import {
  hasRainSoon,
  isRainPredictedOnDate,
  resolveWeatherCoords,
  wateringAdvice,
} from '@/services/weatherLogic';
import { DEFAULT_COORDINATES, DISTRICT_COORDINATES } from '@/config/zones/districtCoordinates';
import { WeatherForecast, DailyWeather } from '@/types/database.types';

function day(date: string, precipitationMm: number): DailyWeather {
  return {
    date,
    tempMaxC: 32,
    tempMinC: 24,
    precipitationMm,
    weatherCode: precipitationMm >= 2 ? 61 : 0,
    precipitationProbabilityPct: precipitationMm >= 2 ? 70 : 10,
  };
}

function makeForecast(daily: DailyWeather[]): WeatherForecast {
  return {
    latitude: 8.08,
    longitude: 77.53,
    timezone: 'Asia/Kolkata',
    daily,
    fetched_at: '2026-06-20T00:00:00.000Z',
  };
}

describe('isRainPredictedOnDate', () => {
  const forecast = makeForecast([
    day('2026-06-20', 0),
    day('2026-06-21', 5),
    day('2026-06-22', 1.5),
  ]);

  it('returns true when rain on the date meets the threshold', () => {
    expect(isRainPredictedOnDate(forecast, new Date('2026-06-21T06:00:00.000Z'))).toBe(true);
  });

  it('returns false when precipitation is below the threshold', () => {
    expect(isRainPredictedOnDate(forecast, new Date('2026-06-22T06:00:00.000Z'))).toBe(false);
  });

  it('returns false for a dry day', () => {
    expect(isRainPredictedOnDate(forecast, new Date('2026-06-20T06:00:00.000Z'))).toBe(false);
  });

  it('returns false for a date outside the forecast window', () => {
    expect(isRainPredictedOnDate(forecast, new Date('2026-06-30T06:00:00.000Z'))).toBe(false);
  });

  it('returns false when the forecast is null', () => {
    expect(isRainPredictedOnDate(null, new Date('2026-06-21T06:00:00.000Z'))).toBe(false);
  });

  it('honours a custom minMm threshold', () => {
    // 1.5mm passes a 1mm threshold but not the default 2mm.
    expect(isRainPredictedOnDate(forecast, new Date('2026-06-22T06:00:00.000Z'), 1)).toBe(true);
  });
});

describe('hasRainSoon', () => {
  // Midday IST on 2026-06-20, so "today" is unambiguously that date.
  const NOW = new Date('2026-06-20T06:00:00.000Z');

  it('is true when a day within the window has meaningful rain', () => {
    const forecast = makeForecast([day('2026-06-20', 0), day('2026-06-21', 4)]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(true);
  });

  it('is false when no day within the window has meaningful rain', () => {
    const forecast = makeForecast([day('2026-06-20', 0), day('2026-06-21', 1)]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(false);
  });

  it('is true when today itself is wet', () => {
    const forecast = makeForecast([day('2026-06-20', 8), day('2026-06-21', 0)]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(true);
  });

  // The C1 regression: a cached forecast served offline keeps the days it has
  // already passed, so slicing `daily` positionally let yesterday's rain tell
  // the grower not to water today.
  it('ignores rain on a day that has already passed', () => {
    const forecast = makeForecast([
      day('2026-06-18', 30),
      day('2026-06-19', 25),
      day('2026-06-20', 0),
      day('2026-06-21', 0),
    ]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(false);
  });

  it('counts forward from today, not from daily[0]', () => {
    const forecast = makeForecast([
      day('2026-06-18', 0),
      day('2026-06-19', 0),
      day('2026-06-20', 0),
      day('2026-06-21', 9),
    ]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(true);
  });

  it('does not look beyond the requested number of days', () => {
    const forecast = makeForecast([
      day('2026-06-20', 0),
      day('2026-06-21', 0),
      day('2026-06-22', 12),
    ]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(false);
    expect(hasRainSoon(forecast, 3, NOW)).toBe(true);
  });

  it('still evaluates future days when the forecast has no row for today', () => {
    const forecast = makeForecast([day('2026-06-21', 6), day('2026-06-22', 0)]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(true);
  });

  it('is false when every day in a stale cache is in the past', () => {
    const forecast = makeForecast([day('2026-06-17', 40), day('2026-06-18', 40)]);
    expect(hasRainSoon(forecast, 2, NOW)).toBe(false);
  });

  it('is false for a null forecast', () => {
    expect(hasRainSoon(null)).toBe(false);
  });
});

describe('wateringAdvice', () => {
  it('tells the user to check soil when rain is coming', () => {
    expect(wateringAdvice(true)).toEqual({
      emoji: '🌧️',
      text: 'Rain expected soon — check soil before watering',
    });
  });

  it('tells the user to keep watering when no rain is coming', () => {
    expect(wateringAdvice(false)).toEqual({
      emoji: '☀️',
      text: 'No rain expected soon — keep watering',
    });
  });

  // The forecast card renders this line in both states so every plot's card is
  // the same height — a shorter card would break the stacked WeatherDeck.
  it('returns advice in both states', () => {
    expect(wateringAdvice(true).text).toBeTruthy();
    expect(wateringAdvice(false).text).toBeTruthy();
  });
});

describe('resolveWeatherCoords', () => {
  it('prefers a plot GPS pin when both lat and lng are set', () => {
    const result = resolveWeatherCoords({ latitude: 12.34, longitude: 56.78 }, 'Madurai');
    expect(result).toEqual({ lat: 12.34, lng: 56.78, source: 'plot' });
  });

  it('falls back to district coordinates when the plot has no GPS', () => {
    const result = resolveWeatherCoords({ latitude: null, longitude: null }, 'Madurai');
    expect(result).toEqual({ ...DISTRICT_COORDINATES.Madurai, source: 'district' });
  });

  it('ignores a partial GPS pin (lat only) and falls through to district', () => {
    const result = resolveWeatherCoords({ latitude: 12.34, longitude: null }, 'Madurai');
    expect(result).toEqual({ ...DISTRICT_COORDINATES.Madurai, source: 'district' });
  });

  it('ignores corrupt or out-of-range stored coordinates', () => {
    expect(resolveWeatherCoords({ latitude: Number.NaN, longitude: 77 }, 'Madurai')).toEqual({
      ...DISTRICT_COORDINATES.Madurai,
      source: 'district',
    });
    expect(resolveWeatherCoords({ latitude: 91, longitude: 77 }, 'Madurai')).toEqual({
      ...DISTRICT_COORDINATES.Madurai,
      source: 'district',
    });
  });

  it('uses the default coordinates for an unknown or absent district', () => {
    expect(resolveWeatherCoords(undefined, 'Atlantis')).toEqual({
      ...DEFAULT_COORDINATES,
      source: 'default',
    });
    expect(resolveWeatherCoords(undefined, undefined)).toEqual({
      ...DEFAULT_COORDINATES,
      source: 'default',
    });
  });

  // The district on a farm config is free text. An exact-match lookup sent a
  // Coimbatore farm the Kanyakumari forecast — and reported it as the app-wide
  // default, so the overlay showed the wrong fallback banner too.
  it('resolves a differently-cased district instead of falling back to the default', () => {
    for (const district of ['coimbatore', 'COIMBATORE', '  Coimbatore  ']) {
      expect(resolveWeatherCoords(undefined, district)).toEqual({
        ...DISTRICT_COORDINATES.Coimbatore,
        source: 'district',
      });
    }
  });
});

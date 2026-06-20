import { hasRainSoon, isRainPredictedOnDate } from '@/services/weatherLogic';
import { WeatherForecast, DailyWeather } from '@/types/database.types';

function day(date: string, precipitationMm: number): DailyWeather {
  return { date, tempMaxC: 32, tempMinC: 24, precipitationMm };
}

function makeForecast(daily: DailyWeather[]): WeatherForecast {
  return {
    latitude: 8.08,
    longitude: 77.53,
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
    expect(isRainPredictedOnDate(forecast, new Date(2026, 5, 21))).toBe(true);
  });

  it('returns false when precipitation is below the threshold', () => {
    expect(isRainPredictedOnDate(forecast, new Date(2026, 5, 22))).toBe(false);
  });

  it('returns false for a dry day', () => {
    expect(isRainPredictedOnDate(forecast, new Date(2026, 5, 20))).toBe(false);
  });

  it('returns false for a date outside the forecast window', () => {
    expect(isRainPredictedOnDate(forecast, new Date(2026, 5, 30))).toBe(false);
  });

  it('returns false when the forecast is null', () => {
    expect(isRainPredictedOnDate(null, new Date(2026, 5, 21))).toBe(false);
  });

  it('honours a custom minMm threshold', () => {
    // 1.5mm passes a 1mm threshold but not the default 2mm.
    expect(isRainPredictedOnDate(forecast, new Date(2026, 5, 22), 1)).toBe(true);
  });
});

describe('hasRainSoon', () => {
  it('is true when a day within the window has meaningful rain', () => {
    const forecast = makeForecast([day('2026-06-20', 0), day('2026-06-21', 4)]);
    expect(hasRainSoon(forecast, 2)).toBe(true);
  });

  it('is false when no day within the window has meaningful rain', () => {
    const forecast = makeForecast([day('2026-06-20', 0), day('2026-06-21', 1)]);
    expect(hasRainSoon(forecast, 2)).toBe(false);
  });

  it('is false for a null forecast', () => {
    expect(hasRainSoon(null)).toBe(false);
  });
});

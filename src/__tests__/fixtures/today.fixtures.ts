import { DailyWeather, FarmAlert, WeatherForecast } from '../../types/database.types';

export function makeFarmAlert(overrides: Partial<FarmAlert> = {}): FarmAlert {
  return {
    id: 'test-alert-id',
    type: 'water_needed',
    title: 'Test Tomato',
    message: 'Water is 2 days overdue',
    severity: 'warning',
    icon: '💧',
    daysOverdue: 2,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeDailyWeather(overrides: Partial<DailyWeather> = {}): DailyWeather {
  return {
    date: '2026-01-01',
    tempMaxC: 31,
    tempMinC: 24,
    precipitationMm: 0,
    ...overrides,
  };
}

/** `days` ISO dates starting at `startDate`, one `DailyWeather` each. */
export function makeWeatherForecast(
  days: DailyWeather[],
  overrides: Partial<WeatherForecast> = {}
): WeatherForecast {
  return {
    latitude: 8.08,
    longitude: 77.55,
    daily: days,
    fetched_at: '2026-01-01T05:50:00.000Z',
    ...overrides,
  };
}

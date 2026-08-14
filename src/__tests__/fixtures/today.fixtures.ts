import {
  DailyWeather,
  FarmAlert,
  PlotBrief,
  WeatherForecast,
} from '../../types/database.types';

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
    weatherCode: 0,
    precipitationProbabilityPct: 0,
    ...overrides,
  };
}

/**
 * A plot card's view-model. Shallow overrides only — a test that needs a
 * different health split or a different sky spreads the whole sub-object, which
 * keeps the totals in the fixture honest rather than half-patched.
 */
export function makePlotBrief(overrides: Partial<PlotBrief> = {}): PlotBrief {
  return {
    id: 'north-plot',
    name: 'North Plot',
    isConfigured: true,
    district: 'Kanyakumari',
    cropCount: 92,
    bedCount: 3,
    bedStatus: { growing: 2, resting: 1, empty: 0, permanent: 0, total: 3 },
    dueCount: 1,
    overdueCount: 0,
    health: { healthy: 77, stressed: 0, recovering: 12, sick: 3, total: 92 },
    weather: {
      lat: 8.08,
      lng: 77.55,
      source: 'plot',
      forecast: null,
      today: null,
      condition: 'clear',
      conditionLabel: 'Clear',
      conditionEmoji: '☀️',
      fetched_at: '2026-08-10T00:00:00.000Z',
      stale: false,
      loading: false,
    },
    line: { kind: null, headline: null, freshness: null },
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
    timezone: 'Asia/Kolkata',
    fetched_at: '2026-01-01T05:50:00.000Z',
    ...overrides,
  };
}

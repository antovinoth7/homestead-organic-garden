/* Jest must install native-boundary mocks before importing the weather service. */
/* eslint-disable import/first, @typescript-eslint/explicit-function-return-type */
jest.mock('@/utils/networkState', () => ({ isNetworkAvailable: () => true }));
jest.mock('@/utils/safeStorage', () => ({
  safeGetItem: jest.fn(async () => null),
  safeSetItem: jest.fn(async () => undefined),
  safeGetAllKeys: jest.fn(async () => []),
  safeMultiRemove: jest.fn(async () => true),
}));

import {
  getWeatherForecast,
  normalizeCachedForecast,
  parseOpenMeteoForecast,
  pruneLegacyWeatherStorage,
} from '@/services/weather';
import { safeGetAllKeys, safeMultiRemove } from '@/utils/safeStorage';
import { invalidateAll } from '@/lib/dataCache';

const validResponse = () => ({
  latitude: 8.12,
  longitude: 77.53,
  timezone: 'Asia/Kolkata',
  daily: {
    time: ['2026-08-09', '2026-08-10'],
    weather_code: [51, 3],
    temperature_2m_max: [30.8, 31],
    temperature_2m_min: [24.8, 24.9],
    precipitation_sum: [0.9, 0.1],
    precipitation_probability_max: [60, 20],
    wind_speed_10m_max: [18, 24],
  },
});

describe('parseOpenMeteoForecast', () => {
  it('parses aligned validated daily data', () => {
    const forecast = parseOpenMeteoForecast(validResponse());
    expect(forecast.timezone).toBe('Asia/Kolkata');
    expect(forecast.daily[0]).toMatchObject({
      date: '2026-08-09',
      weatherCode: 51,
      precipitationProbabilityPct: 60,
      windSpeedMaxKph: 18,
      precipitationMm: 0.9,
    });
  });

  it.each([
    ['missing daily data', { ...validResponse(), daily: undefined }],
    [
      'misaligned arrays',
      {
        ...validResponse(),
        daily: { ...validResponse().daily, weather_code: [51] },
      },
    ],
    [
      'non-finite values',
      {
        ...validResponse(),
        daily: { ...validResponse().daily, precipitation_sum: [Number.NaN, 0] },
      },
    ],
    [
      'out-of-range temperatures',
      {
        ...validResponse(),
        daily: { ...validResponse().daily, temperature_2m_max: [80, 31] },
      },
    ],
  ])('rejects %s', (_label, response) => {
    expect(() => parseOpenMeteoForecast(response)).toThrow();
  });

  // Open-Meteo omits values it has no model data for rather than shortening the
  // array. Dropping the whole forecast over one of them would strand the user on
  // a stale cache for a day that is otherwise complete.
  it.each([
    ['a null probability', 'precipitation_probability_max', [null, 20]],
    ['an out-of-range probability', 'precipitation_probability_max', [101, 20]],
    ['a null weather code', 'weather_code', [null, 3]],
    ['an out-of-range weather code', 'weather_code', [512, 3]],
  ])('keeps the day and nulls the field for %s', (_label, field, values) => {
    const forecast = parseOpenMeteoForecast({
      ...validResponse(),
      daily: { ...validResponse().daily, [field]: values },
    });
    expect(forecast.daily).toHaveLength(2);
    const nulled =
      field === 'weather_code'
        ? forecast.daily[0]!.weatherCode
        : forecast.daily[0]!.precipitationProbabilityPct;
    expect(nulled).toBeNull();
    // The rest of the day survives intact, and the second day is untouched.
    expect(forecast.daily[0]).toMatchObject({ date: '2026-08-09', precipitationMm: 0.9 });
    expect(forecast.daily[1]).toMatchObject({ weatherCode: 3, precipitationProbabilityPct: 20 });
  });
});

describe('normalizeCachedForecast', () => {
  it('upgrades a valid legacy cache entry with nullable new fields and a timezone', () => {
    const normalized = normalizeCachedForecast({
      latitude: 8.08,
      longitude: 77.55,
      fetched_at: '2026-08-09T00:00:00.000Z',
      daily: [
        {
          date: '2026-08-09',
          tempMaxC: 31,
          tempMinC: 24,
          precipitationMm: 3,
        },
      ],
    });
    expect(normalized).toMatchObject({ timezone: 'Asia/Kolkata' });
    expect(normalized?.daily[0]).toMatchObject({
      weatherCode: null,
      precipitationProbabilityPct: null,
    });
  });

  it('rejects corrupt cached data', () => {
    expect(
      normalizeCachedForecast({
        latitude: 8,
        longitude: 77,
        fetched_at: 'bad-date',
        daily: [],
      })
    ).toBeNull();
  });
});

describe('getWeatherForecast cache policy', () => {
  beforeEach(() => {
    invalidateAll();
    jest.restoreAllMocks();
  });

  function mockFetch(): jest.Mock {
    const mocked = jest.fn(async () => ({
      ok: true,
      json: async () => validResponse(),
    }));
    globalThis.fetch = mocked as unknown as typeof fetch;
    return mocked;
  }

  it('serves a fresh coordinate cache unless a manual refresh forces the network', async () => {
    const fetchMock = mockFetch();
    await getWeatherForecast(8.1234, 77.5678);
    await getWeatherForecast(8.1234, 77.5678);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await getWeatherForecast(8.1234, 77.5678, { force: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const requested = new URL(fetchMock.mock.calls[0]![0] as string);
    expect(requested.searchParams.get('forecast_days')).toBe('7');
    expect(requested.searchParams.get('timezone')).toBe('Asia/Kolkata');
    expect(requested.searchParams.get('daily')).toBe(
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max'
    );
  });

  it('deduplicates concurrent requests for the same coordinates', async () => {
    const fetchMock = mockFetch();
    await Promise.all([getWeatherForecast(8.2234, 77.6678), getWeatherForecast(8.2234, 77.6678)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not collide plots that differ at four coordinate decimals', async () => {
    const fetchMock = mockFetch();
    await getWeatherForecast(8.30001, 77.7);
    await getWeatherForecast(8.30009, 77.7);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects invalid input coordinates before making a request', async () => {
    const fetchMock = mockFetch();
    await expect(getWeatherForecast(91, 77)).rejects.toThrow(RangeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// The key gained two decimals of precision, orphaning every entry a previous
// install wrote — they are never read and would never be overwritten.
describe('pruneLegacyWeatherStorage', () => {
  it('removes only coarse-key forecast entries, leaving current and unrelated keys', async () => {
    (safeGetAllKeys as jest.Mock).mockResolvedValueOnce([
      '@garden_weather:weather:8.09,77.54',
      '@garden_weather:weather:-8.1,-77.5',
      '@garden_weather:weather:8.4000,77.7000',
      '@garden_weather:weather:-8.4000,-77.7000',
      '@garden_plants',
    ]);

    await pruneLegacyWeatherStorage();

    expect(safeMultiRemove).toHaveBeenCalledWith([
      '@garden_weather:weather:8.09,77.54',
      '@garden_weather:weather:-8.1,-77.5',
    ]);
  });
});

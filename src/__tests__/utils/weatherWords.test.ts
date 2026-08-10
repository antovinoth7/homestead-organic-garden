import {
  describeDay,
  FALLBACK_BANNER_COPY,
  forecastDateKey,
  forecastDayLabel,
  formatForecastDate,
  formatRain,
  formatRainChance,
  formatTempRange,
  selectForecastDays,
  weatherEmoji,
  weekdayLabel,
} from '../../utils/weatherWords';
import { makeDailyWeather, makeWeatherForecast } from '../fixtures/today.fixtures';

describe('describeDay', () => {
  it.each([
    [0, 'clear', 'Clear'],
    [1, 'clear', 'Mostly clear'],
    [2, 'partly_cloudy', 'Partly cloudy'],
    [3, 'cloudy', 'Overcast'],
    [45, 'fog', 'Fog'],
    [51, 'drizzle', 'Drizzle'],
    [61, 'rain', 'Rain'],
    [65, 'heavy_rain', 'Heavy rain'],
    [80, 'showers', 'Showers'],
    [82, 'heavy_showers', 'Heavy showers'],
    [71, 'snow', 'Snow'],
    [95, 'thunderstorm', 'Thunderstorm'],
    [50, 'unknown', 'Unknown'],
  ])('maps WMO code %i to %s', (weatherCode, id, label) => {
    expect(describeDay(makeDailyWeather({ weatherCode }))).toMatchObject({ id, label });
  });

  it('reports heat ahead of an otherwise non-hazardous sky condition', () => {
    expect(describeDay(makeDailyWeather({ weatherCode: 2, tempMaxC: 35 })).id).toBe('hot');
    expect(describeDay(makeDailyWeather({ weatherCode: 61, tempMaxC: 40 })).id).toBe('rain');
  });

  it('uses generic rain, never showers, for a legacy cache entry', () => {
    expect(describeDay(makeDailyWeather({ weatherCode: null, precipitationMm: 3 })).id).toBe(
      'rain'
    );
    expect(describeDay(makeDailyWeather({ weatherCode: null, precipitationMm: 12 })).id).toBe(
      'heavy_rain'
    );
  });

  it('reports missing data as unknown', () => {
    expect(describeDay(null)).toMatchObject({ id: 'unknown', label: 'No forecast' });
  });
});

describe('forecast dates', () => {
  it('builds the farm date around a UTC midnight boundary', () => {
    expect(forecastDateKey(new Date('2026-08-09T20:00:00.000Z'), 'Asia/Kolkata')).toBe(
      '2026-08-10'
    );
    expect(forecastDateKey(new Date('2026-08-09T18:00:00.000Z'), 'Asia/Kolkata')).toBe(
      '2026-08-09'
    );
  });

  it('selects today plus six future days and removes expired cache rows', () => {
    const days = Array.from({ length: 7 }, (_, index) =>
      makeDailyWeather({ date: `2026-08-${String(index + 9).padStart(2, '0')}` })
    );
    const result = selectForecastDays(
      makeWeatherForecast(days),
      new Date('2026-08-09T06:00:00.000Z')
    );
    expect(result.today?.date).toBe('2026-08-09');
    expect(result.future.map((day) => day.date)).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
      '2026-08-15',
    ]);
    expect(result.available).toHaveLength(7);
  });

  it('removes expired rows from a stale cached forecast', () => {
    const result = selectForecastDays(
      makeWeatherForecast([
        makeDailyWeather({ date: '2026-08-08' }),
        makeDailyWeather({ date: '2026-08-09' }),
        makeDailyWeather({ date: '2026-08-10' }),
      ]),
      new Date('2026-08-09T06:00:00.000Z')
    );
    expect(result.available.map((day) => day.date)).toEqual(['2026-08-09', '2026-08-10']);
  });

  it('shows all available non-past days when the provider has no today row', () => {
    const forecast = makeWeatherForecast([
      makeDailyWeather({ date: '2026-08-10' }),
      makeDailyWeather({ date: '2026-08-11' }),
    ]);
    const result = selectForecastDays(forecast, new Date('2026-08-09T06:00:00.000Z'));
    expect(result.today).toBeNull();
    expect(result.future).toHaveLength(2);
  });

  it('uses Today, Tomorrow, and dated future labels', () => {
    expect(forecastDayLabel('2026-08-09', '2026-08-09')).toBe('Today');
    expect(forecastDayLabel('2026-08-10', '2026-08-09')).toBe('Tomorrow');
    expect(forecastDayLabel('2026-08-11', '2026-08-09')).toBe('Tue · 11 Aug');
    expect(formatForecastDate('2026-08-09')).toBe('Sun 9 Aug');
  });

  it('names weekdays without shifting an ISO date across timezones', () => {
    expect(weekdayLabel('2026-07-31')).toBe('Fri');
    expect(weekdayLabel('not-a-date')).toBe('');
  });
});

describe('weather formatting', () => {
  it('formats temperatures, rain, and rain chance', () => {
    const day = makeDailyWeather({
      tempMaxC: 30.6,
      tempMinC: 23.4,
      precipitationMm: 11.6,
      precipitationProbabilityPct: 64.6,
    });
    expect(formatTempRange(day)).toBe('31° / 23°');
    expect(formatRain(day)).toBe('12mm');
    expect(formatRainChance(day)).toBe('65%');
  });

  it('uses dashes for unavailable or immaterial values', () => {
    expect(formatTempRange(null)).toBe('—');
    expect(formatRain(makeDailyWeather({ precipitationMm: 0.4 }))).toBe('—');
    expect(formatRainChance(makeDailyWeather({ precipitationProbabilityPct: null }))).toBe('—');
  });

  it('uses the condition mapping for weather emoji', () => {
    expect(weatherEmoji(makeDailyWeather({ weatherCode: 95 }))).toBe('⛈️');
  });
});

describe('FALLBACK_BANNER_COPY', () => {
  it('names a district and handles a missing district', () => {
    expect(FALLBACK_BANNER_COPY.district('Kanyakumari')).toContain('Kanyakumari');
    expect(FALLBACK_BANNER_COPY.district(null)).not.toContain('null');
  });

  it('explains the default coordinates', () => {
    expect(FALLBACK_BANNER_COPY.default(null)).toContain('default');
  });
});

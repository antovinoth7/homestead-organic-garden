import {
  describeDay,
  FALLBACK_BANNER_COPY,
  formatRain,
  formatTempRange,
  weatherEmoji,
  weekdayLabel,
} from '../../utils/weatherWords';
import { makeDailyWeather } from '../fixtures/today.fixtures';

describe('describeDay', () => {
  it.each([
    { mm: 10, id: 'heavy_rain', label: 'Heavy rain' },
    { mm: 9.99, id: 'rain', label: 'Rain' },
    { mm: 5, id: 'rain', label: 'Rain' },
    { mm: 4.99, id: 'showers', label: 'Showers' },
    { mm: 2, id: 'showers', label: 'Showers' },
    { mm: 1.99, id: 'clear', label: 'Clear' },
    { mm: 0, id: 'clear', label: 'Clear' },
  ])('calls $mm mm "$label"', ({ mm, id, label }) => {
    const result = describeDay(makeDailyWeather({ precipitationMm: mm }));
    expect(result.id).toBe(id);
    expect(result.label).toBe(label);
  });

  it('reports heat only on a dry day', () => {
    expect(describeDay(makeDailyWeather({ tempMaxC: 35 })).id).toBe('hot');
    expect(describeDay(makeDailyWeather({ tempMaxC: 34.9 })).id).toBe('clear');
    // Rain outranks heat — it changes what you can do, heat only when.
    expect(describeDay(makeDailyWeather({ tempMaxC: 40, precipitationMm: 12 })).id).toBe(
      'heavy_rain'
    );
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('reports %s as unknown rather than inventing a condition', (_label, value) => {
    expect(describeDay(value).id).toBe('unknown');
    expect(describeDay(value).label).toBe('No forecast');
  });
});

describe('weatherEmoji', () => {
  // These are the glyphs WeatherPlotCard used before the helper moved here, so
  // that card must keep rendering identically.
  it.each([
    [12, '🌧️'],
    [6, '🌦️'],
    [3, '🌦️'],
    [0, '☀️'],
  ])('maps %i mm to %s', (mm, emoji) => {
    expect(weatherEmoji(makeDailyWeather({ precipitationMm: mm }))).toBe(emoji);
  });

  it('marks a dry 35°C day as hot', () => {
    expect(weatherEmoji(makeDailyWeather({ tempMaxC: 36 }))).toBe('🔥');
  });
});

describe('weekdayLabel', () => {
  it('names the weekday', () => {
    expect(weekdayLabel('2026-07-31')).toBe('Fri');
  });

  it('returns empty for an unparseable date rather than "Invalid Date"', () => {
    expect(weekdayLabel('not-a-date')).toBe('');
  });
});

describe('formatTempRange / formatRain', () => {
  it('rounds the temperature pair', () => {
    expect(formatTempRange(makeDailyWeather({ tempMaxC: 30.6, tempMinC: 23.4 }))).toBe('31° / 23°');
  });

  it('dashes a missing day', () => {
    expect(formatTempRange(null)).toBe('—');
    expect(formatRain(null)).toBe('—');
  });

  it('shows rain only once it is worth mentioning', () => {
    expect(formatRain(makeDailyWeather({ precipitationMm: 0 }))).toBe('—');
    expect(formatRain(makeDailyWeather({ precipitationMm: 0.4 }))).toBe('—');
    expect(formatRain(makeDailyWeather({ precipitationMm: 1 }))).toBe('1mm');
    expect(formatRain(makeDailyWeather({ precipitationMm: 11.6 }))).toBe('12mm');
  });
});

describe('FALLBACK_BANNER_COPY', () => {
  it('names the district when there is one', () => {
    expect(FALLBACK_BANNER_COPY.district('Kanyakumari')).toContain('Kanyakumari');
  });

  it('still reads sensibly with no district saved', () => {
    const copy = FALLBACK_BANNER_COPY.district(null);
    expect(copy).toContain('district');
    expect(copy).not.toContain('null');
  });

  it('explains the default coordinates', () => {
    expect(FALLBACK_BANNER_COPY.default(null)).toContain('default');
  });
});

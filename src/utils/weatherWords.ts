/** Shared weather wording and farm-timezone date helpers. */

import { DailyWeather, WeatherConditionId, WeatherForecast } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';

export interface DayDescription {
  id: WeatherConditionId;
  label: string;
  iconKey: VisualIconKey;
}

export interface VisibleForecastDays {
  today: DailyWeather | null;
  future: DailyWeather[];
  available: DailyWeather[];
  todayKey: string;
}

export const FARM_TIMEZONE = 'Asia/Kolkata';
export const SHOWERS_MM = 2;
export const DRY_DAY_MM = 1;
const HEAVY_RAIN_MM = 10;
const HOT_C = 35;

function codeDescription(code: number): DayDescription {
  if (code === 0) return { id: 'clear', label: 'Clear', iconKey: 'weather.clear' };
  if (code === 1) return { id: 'clear', label: 'Mostly clear', iconKey: 'weather.clear' };
  if (code === 2)
    return { id: 'partly_cloudy', label: 'Partly cloudy', iconKey: 'weather.partly_cloudy' };
  if (code === 3) return { id: 'cloudy', label: 'Overcast', iconKey: 'weather.cloudy' };
  if (code === 45 || code === 48) return { id: 'fog', label: 'Fog', iconKey: 'weather.fog' };
  if ([51, 53, 55, 56, 57].includes(code))
    return { id: 'drizzle', label: 'Drizzle', iconKey: 'weather.drizzle' };
  if ([61, 63, 66].includes(code))
    return { id: 'rain', label: 'Rain', iconKey: 'weather.rain' };
  if (code === 65 || code === 67)
    return { id: 'heavy_rain', label: 'Heavy rain', iconKey: 'weather.heavy_rain' };
  if (code === 80 || code === 81)
    return { id: 'showers', label: 'Showers', iconKey: 'weather.showers' };
  if (code === 82)
    return { id: 'heavy_showers', label: 'Heavy showers', iconKey: 'weather.heavy_showers' };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { id: 'snow', label: 'Snow', iconKey: 'weather.snow' };
  if ([95, 96, 99].includes(code))
    return { id: 'thunderstorm', label: 'Thunderstorm', iconKey: 'weather.thunderstorm' };
  return { id: 'unknown', label: 'Unknown', iconKey: 'weather.unknown' };
}

export function describeDay(day: DailyWeather | null | undefined): DayDescription {
  if (!day) return { id: 'unknown', label: 'No forecast', iconKey: 'weather.unknown' };

  if (day.weatherCode != null) {
    const described = codeDescription(day.weatherCode);
    // Heat is the more operationally important signal on otherwise benign days.
    if (day.tempMaxC >= HOT_C && day.weatherCode >= 0 && day.weatherCode <= 3) {
      return { id: 'hot', label: 'Hot', iconKey: 'weather.hot' };
    }
    return described;
  }

  // Backward-compatible cache fallback. Total precipitation cannot distinguish
  // showers from steady rain, so legacy entries deliberately use generic rain.
  if (day.precipitationMm >= HEAVY_RAIN_MM)
    return { id: 'heavy_rain', label: 'Heavy rain', iconKey: 'weather.heavy_rain' };
  if (day.precipitationMm >= SHOWERS_MM)
    return { id: 'rain', label: 'Rain', iconKey: 'weather.rain' };
  if (day.tempMaxC >= HOT_C) return { id: 'hot', label: 'Hot', iconKey: 'weather.hot' };
  return { id: 'clear', label: 'Clear', iconKey: 'weather.clear' };
}

export function weatherIconKey(day: DailyWeather): VisualIconKey {
  return describeDay(day).iconKey;
}

function dateAtNoonUtc(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00.000Z`);
}

/**
 * The day's name. Abbreviated by default, for the narrow forecast columns that
 * are most of the callers; prose asks for `'long'` explicitly, where "Thursday"
 * cannot be misread the way "Thu" can.
 */
export function weekdayLabel(isoDate: string, width: 'short' | 'long' = 'short'): string {
  const d = dateAtNoonUtc(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: width, timeZone: 'UTC' });
}

export function forecastDateKey(now: Date = new Date(), timeZone = FARM_TIMEZONE): string {
  // An unparseable date has to bail before the formatter: `formatToParts` throws
  // on it, which sends the non-farm-zone branch into a recursion that ends at
  // `toISOString()` — and that throws too, uncaught.
  if (Number.isNaN(now.getTime())) return '';
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const value = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((part) => part.type === type)?.value ?? '';
    const key = `${value('year')}-${value('month')}-${value('day')}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key;
  } catch {
    // Invalid/unsupported stored timezones fall back to the farm default below.
  }
  if (timeZone !== FARM_TIMEZONE) return forecastDateKey(now, FARM_TIMEZONE);
  // Only reachable if the runtime cannot resolve Asia/Kolkata at all, which
  // Hermes with its bundled tz data does not do. This last resort is UTC, so it
  // is 5:30h behind the farm and names the previous day after 18:30 IST.
  return now.toISOString().slice(0, 10);
}

/**
 * The same calendar-date key, for a value that is not already a `Date`.
 *
 * Any key that will be compared against `WeatherForecast.daily[].date` must come
 * from here: those dates are the provider's buckets in the farm's timezone, not
 * the device's calendar days. Returns '' for an unparseable value so callers can
 * skip the record rather than bucket it wrongly.
 */
export function forecastDateKeyFrom(
  value: string | number | Date,
  timeZone = FARM_TIMEZONE
): string {
  const date = value instanceof Date ? value : new Date(value);
  return forecastDateKey(date, timeZone);
}

const DAY_COUNT_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];

/**
 * Heading above the day rows. Derived from how many rows actually render, not
 * from the seven days a full forecast would have — a cached copy that starts
 * before today is trimmed by `selectForecastDays` and would otherwise be
 * announced as six days while showing five.
 */
export function forecastSectionLabel(hasToday: boolean, rowCount: number): string {
  if (!hasToday) return 'Available forecast';
  if (rowCount <= 0) return 'Nothing further forecast';
  if (rowCount === 1) return 'Tomorrow only';
  return `Next ${DAY_COUNT_WORDS[rowCount] ?? rowCount} days`;
}

export function selectForecastDays(
  forecast: WeatherForecast | null,
  now: Date = new Date()
): VisibleForecastDays {
  const todayKey = forecastDateKey(now, forecast?.timezone ?? FARM_TIMEZONE);
  const available = (forecast?.daily ?? []).filter((day) => day.date >= todayKey).slice(0, 7);
  const today = available.find((day) => day.date === todayKey) ?? null;
  const future = available.filter((day) => day.date > todayKey).slice(0, today ? 6 : 7);
  return { today, future, available, todayKey };
}

export function forecastDayLabel(isoDate: string, todayKey: string): string {
  const today = dateAtNoonUtc(todayKey);
  const date = dateAtNoonUtc(isoDate);
  if (Number.isNaN(today.getTime()) || Number.isNaN(date.getTime())) return weekdayLabel(isoDate);
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${weekdayLabel(isoDate)} · ${date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })}`;
}

export function formatForecastDate(isoDate: string): string {
  const date = dateAtNoonUtc(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** One temperature. Separate so a caller setting the two halves in different
 * type still rounds them the way the range does. */
export function formatTemp(celsius: number): string {
  return `${Math.round(celsius)}°`;
}

export function formatTempRange(day: DailyWeather | null | undefined): string {
  if (!day) return '—';
  return `${formatTemp(day.tempMaxC)} / ${formatTemp(day.tempMinC)}`;
}

/**
 * The day's rainfall. An em dash means "no forecast" and nothing else — a dry
 * day says so in words. Sharing the dash with `formatRainChance`'s missing-data
 * case made "61% rain · —" read as a gap in the data rather than as a real
 * forecast of under a millimetre.
 */
export function formatRain(day: DailyWeather | null | undefined): string {
  if (!day) return '—';
  if (day.precipitationMm <= 0) return 'dry';
  if (day.precipitationMm < DRY_DAY_MM) return '<1 mm';
  return `${Math.round(day.precipitationMm)} mm`;
}

export function formatRainChance(day: DailyWeather | null | undefined): string {
  if (!day || day.precipitationProbabilityPct == null) return '—';
  return `${Math.round(day.precipitationProbabilityPct)}%`;
}

export const FALLBACK_BANNER_COPY: Record<
  'district' | 'default',
  (district: string | null) => string
> = {
  district: (district) =>
    `Showing ${
      district ?? 'district'
    } readings — this plot has no location saved, so the figures are for the district, not the field.`,
  default: () =>
    'Showing the default Kanyakumari readings — no district or plot location is saved yet.',
};

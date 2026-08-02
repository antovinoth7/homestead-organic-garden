/**
 * Weather wording for the Today screen and its forecast overlay.
 *
 * Open-Meteo is queried for daily aggregates only — max/min temperature and
 * total precipitation, no weather code and no hourly series (see
 * `services/weather.ts`). So the condition word is derived from those three
 * numbers, and nothing here can promise a time of day ("dry till evening").
 *
 * The emoji ladder is exactly the one `WeatherPlotCard` used before this moved
 * here, so that card renders identically. The labels split its 🌦️ band into
 * "Rain" and "Showers" — a distinction the overlay's wording needs but the
 * emoji never made.
 */

import { DailyWeather, WeatherConditionId } from '@/types/database.types';

export interface DayDescription {
  id: WeatherConditionId;
  label: string;
  emoji: string;
}

const HEAVY_RAIN_MM = 10;
const RAIN_MM = 5;
/**
 * Exported so the plot line's rain warning fires on exactly the millimetres
 * that make `describeDay` say "Showers" — the sentence and the chip beside it
 * must not disagree about whether a day is wet.
 */
export const SHOWERS_MM = 2;
const HOT_C = 35;

/** Below this a day reads as dry — the rain slot shows a dash instead of "0mm". */
export const DRY_DAY_MM = 1;

export function describeDay(day: DailyWeather | null | undefined): DayDescription {
  if (!day) return { id: 'unknown', label: 'No forecast', emoji: '☁️' };
  if (day.precipitationMm >= HEAVY_RAIN_MM)
    return { id: 'heavy_rain', label: 'Heavy rain', emoji: '🌧️' };
  if (day.precipitationMm >= RAIN_MM) return { id: 'rain', label: 'Rain', emoji: '🌦️' };
  if (day.precipitationMm >= SHOWERS_MM) return { id: 'showers', label: 'Showers', emoji: '🌦️' };
  if (day.tempMaxC >= HOT_C) return { id: 'hot', label: 'Hot', emoji: '🔥' };
  return { id: 'clear', label: 'Clear', emoji: '☀️' };
}

/** Kept as its own export so `WeatherPlotCard` can drop its private copy. */
export function weatherEmoji(day: DailyWeather): string {
  return describeDay(day).emoji;
}

export function weekdayLabel(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

/** "31° / 24°", or a dash pair when the day is missing. */
export function formatTempRange(day: DailyWeather | null | undefined): string {
  if (!day) return '—';
  return `${Math.round(day.tempMaxC)}° / ${Math.round(day.tempMinC)}°`;
}

/** "8mm" once there is meaningful rain, otherwise a dash. */
export function formatRain(day: DailyWeather | null | undefined): string {
  if (!day || day.precipitationMm < DRY_DAY_MM) return '—';
  return `${Math.round(day.precipitationMm)}mm`;
}

/**
 * Explains a forecast that isn't actually this plot's. `WeatherPlot.source` is
 * set by `resolveWeatherCoords`: 'plot' when the plot has its own GPS pin,
 * 'district' when it falls back to the farm's district, 'default' when even
 * that is unset.
 */
export const FALLBACK_BANNER_COPY: Record<'district' | 'default', (district: string | null) => string> =
  {
    district: (district) =>
      `Showing ${district ?? 'district'} readings — this plot has no location saved, so the figures are for the district, not the field.`,
    default: () =>
      'Showing the default Kanyakumari readings — no district or plot location is saved yet.',
  };

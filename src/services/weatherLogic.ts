/**
 * Pure weather helpers (no network / native deps) — split out of `weather.ts`
 * so they are unit-testable in isolation, mirroring `alertsLogic`/`bedLogic`.
 */

import { WeatherForecast } from '@/types/database.types';

/** True when any of the next `days` days has meaningful rain (≥ 2mm). */
export function hasRainSoon(forecast: WeatherForecast | null, days = 2): boolean {
  if (!forecast) return false;
  return forecast.daily.slice(0, days).some((d) => d.precipitationMm >= 2);
}

/** Local calendar-day key (YYYY-MM-DD) matching `DailyWeather.date`. */
function toForecastDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * True when the forecast predicts ≥ `minMm` rain on the given calendar day.
 * Dates outside the 7-day forecast window return false (no data → no claim).
 */
export function isRainPredictedOnDate(
  forecast: WeatherForecast | null,
  date: Date,
  minMm = 2
): boolean {
  if (!forecast) return false;
  const key = toForecastDateKey(date);
  return forecast.daily.some((d) => d.date === key && d.precipitationMm >= minMm);
}

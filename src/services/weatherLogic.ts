/**
 * Pure weather helpers (no network / native deps) — split out of `weather.ts`
 * so they are unit-testable in isolation, mirroring `alertsLogic`/`bedLogic`.
 */

import { WeatherForecast, LocationProfile } from '@/types/database.types';
import { getDistrictCoordinates, DEFAULT_COORDINATES } from '@/config/zones/districtCoordinates';

export interface WeatherCoords {
  lat: number;
  lng: number;
  /** Where the coordinates came from — drives nothing, but handy for debugging/UI. */
  source: 'plot' | 'district' | 'default';
}

/**
 * Resolve which coordinates to query weather for: a plot's manually-entered GPS
 * pin wins; otherwise the farm district's HQ-town coordinates; otherwise the
 * Kanyakumari default. Pure so it can be unit-tested without native deps.
 */
export function resolveWeatherCoords(
  profile?: LocationProfile | null,
  district?: string | null
): WeatherCoords {
  if (profile?.latitude != null && profile?.longitude != null) {
    return { lat: profile.latitude, lng: profile.longitude, source: 'plot' };
  }
  const districtCoords = getDistrictCoordinates(district);
  if (districtCoords) {
    return { lat: districtCoords.lat, lng: districtCoords.lng, source: 'district' };
  }
  return { lat: DEFAULT_COORDINATES.lat, lng: DEFAULT_COORDINATES.lng, source: 'default' };
}

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

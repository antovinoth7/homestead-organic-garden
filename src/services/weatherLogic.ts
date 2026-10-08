/**
 * Pure weather helpers (no network / native deps) — split out of `weather.ts`
 * so they are unit-testable in isolation, mirroring `alertsLogic`/`bedLogic`.
 */

import { WeatherForecast, LocationProfile } from '@/types/database.types';
import { getDistrictCoordinates, DEFAULT_COORDINATES } from '@/config/zones/districtCoordinates';
import { forecastDateKey, SHOWERS_MM } from '@/utils/weatherWords';

export interface WeatherCoords {
  lat: number;
  lng: number;
  /** Where the coordinates came from — drives nothing, but handy for debugging/UI. */
  source: 'plot' | 'district' | 'default';
}

/** Service-boundary validation also protects callers from corrupt stored profiles. */
export function isValidWeatherCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
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
  if (
    profile?.latitude != null &&
    profile?.longitude != null &&
    isValidWeatherCoordinates(profile.latitude, profile.longitude)
  ) {
    return { lat: profile.latitude, lng: profile.longitude, source: 'plot' };
  }
  const districtCoords = getDistrictCoordinates(district);
  if (districtCoords) {
    return { lat: districtCoords.lat, lng: districtCoords.lng, source: 'district' };
  }
  return { lat: DEFAULT_COORDINATES.lat, lng: DEFAULT_COORDINATES.lng, source: 'default' };
}

/**
 * True when the forecast predicts ≥ `minMm` rain on the given calendar day.
 * Dates outside the 7-day forecast window return false (no data → no claim).
 */
export function isRainPredictedOnDate(
  forecast: WeatherForecast | null,
  date: Date,
  minMm = SHOWERS_MM
): boolean {
  if (!forecast) return false;
  const key = forecastDateKey(date, forecast.timezone);
  return forecast.daily.some((d) => d.date === key && d.precipitationMm >= minMm);
}

/**
 * Pure weather helpers (no network / native deps) — split out of `weather.ts`
 * so they are unit-testable in isolation, mirroring `alertsLogic`/`bedLogic`.
 */

import { WeatherForecast, LocationProfile } from '@/types/database.types';
import { getDistrictCoordinates, DEFAULT_COORDINATES } from '@/config/zones/districtCoordinates';
import { forecastDateKey, selectForecastDays, SHOWERS_MM } from '@/utils/weatherWords';
import type { VisualIconKey } from '@/types/visual.types';

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
 * True when any of the next `days` days has meaningful rain (≥ `SHOWERS_MM`).
 *
 * Counts forward from today, not from `daily[0]`: a cached forecast served
 * offline keeps the days it has already passed, so slicing the raw array let
 * yesterday's rain tell the grower not to water today.
 */
export function hasRainSoon(
  forecast: WeatherForecast | null,
  days = 2,
  now: Date = new Date()
): boolean {
  if (!forecast) return false;
  return selectForecastDays(forecast, now)
    .available.slice(0, days)
    .some((d) => d.precipitationMm >= SHOWERS_MM);
}

export interface WateringAdvice {
  iconKey: VisualIconKey;
  text: string;
}

/**
 * Watering guidance for the forecast card's status line. Both branches are one
 * short line so the card keeps the same height whether rain is coming or not —
 * the deck stacks cards for several plots and they must all measure the same.
 */
export function wateringAdvice(rainSoon: boolean): WateringAdvice {
  return rainSoon
    ? { iconKey: 'weather.rain', text: 'Rain expected soon — check soil before watering' }
    : { iconKey: 'weather.clear', text: 'No rain expected soon — keep watering' };
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

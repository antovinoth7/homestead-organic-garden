/** Open-Meteo seven-day forecast with validated cache-first/offline behavior. */

import { WeatherForecast, DailyWeather } from '@/types/database.types';
import { safeGetAllKeys, safeGetItem, safeMultiRemove, safeSetItem } from '@/utils/safeStorage';
import { KEYS } from '@/lib/storage';
import { withTimeoutAndRetry } from '@/utils/firestoreTimeout';
import { peekCached, setCached, dedup, CACHE_KEYS } from '@/lib/dataCache';
import { logger } from '@/utils/logger';
import { FARM_TIMEZONE } from '@/utils/weatherWords';
import { isValidWeatherCoordinates } from './weatherLogic';

export {
  hasRainSoon,
  isRainPredictedOnDate,
  isValidWeatherCoordinates,
  resolveWeatherCoords,
  wateringAdvice,
} from './weatherLogic';
export type { WeatherCoords, WateringAdvice } from './weatherLogic';

export const KANYAKUMARI_LAT = 8.0883;
export const KANYAKUMARI_LNG = 77.5385;
export const WEATHER_FRESH_MS = 3 * 60 * 60 * 1000;
export const OPEN_METEO_ATTRIBUTION_URL = 'https://open-meteo.com/';

const WEATHER_TIMEOUT_MS = 15000;
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

interface OpenMeteoResponse {
  latitude?: unknown;
  longitude?: unknown;
  timezone?: unknown;
  daily?: {
    time?: unknown;
    weather_code?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
    precipitation_sum?: unknown;
    precipitation_probability_max?: unknown;
    wind_speed_10m_max?: unknown;
  };
}

export interface WeatherFetchOptions {
  /** Bypass the three-hour freshness check, e.g. an explicit pull-to-refresh. */
  force?: boolean;
}

function buildUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max',
    timezone: FARM_TIMEZONE,
    forecast_days: '7',
  });
  return `${OPEN_METEO_FORECAST_URL}?${params.toString()}`;
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function asNumberArray(value: unknown, length: number, name: string): number[] {
  if (!Array.isArray(value) || value.length !== length) {
    throw new Error(`Open-Meteo ${name} length does not match daily.time`);
  }
  if (!value.every((item) => typeof item === 'number' && Number.isFinite(item))) {
    throw new Error(`Open-Meteo ${name} contains a non-finite value`);
  }
  return value as number[];
}

/**
 * The same length check, but a missing element degrades to `null` instead of
 * rejecting the payload. Open-Meteo omits values it has no model data for —
 * `precipitation_probability_max` in particular thins out towards day 7 — and a
 * day without a probability is still a usable day. `DailyWeather` types both of
 * these fields nullable for exactly this reason. Reserved for the fields the UI
 * can render as "—"; dates, temperatures and precipitation stay strict.
 */
function asOptionalNumberArray(value: unknown, length: number, name: string): (number | null)[] {
  if (!Array.isArray(value) || value.length !== length) {
    throw new Error(`Open-Meteo ${name} length does not match daily.time`);
  }
  return value.map((item) => (typeof item === 'number' && Number.isFinite(item) ? item : null));
}

export function parseOpenMeteoForecast(value: unknown): WeatherForecast {
  if (!value || typeof value !== 'object')
    throw new Error('Open-Meteo returned an invalid payload');
  const json = value as OpenMeteoResponse;
  if (
    typeof json.latitude !== 'number' ||
    typeof json.longitude !== 'number' ||
    !isValidWeatherCoordinates(json.latitude, json.longitude)
  ) {
    throw new Error('Open-Meteo returned invalid coordinates');
  }

  const times = json.daily?.time;
  if (!Array.isArray(times) || times.length < 1 || times.length > 7 || !times.every(isValidDate)) {
    throw new Error('Open-Meteo returned invalid daily dates');
  }
  if (
    new Set(times).size !== times.length ||
    times.some((date, i) => i > 0 && date <= times[i - 1]!)
  ) {
    throw new Error('Open-Meteo daily dates are not unique and ascending');
  }

  const length = times.length;
  const codes = asOptionalNumberArray(json.daily?.weather_code, length, 'weather_code');
  const maxTemps = asNumberArray(json.daily?.temperature_2m_max, length, 'temperature_2m_max');
  const minTemps = asNumberArray(json.daily?.temperature_2m_min, length, 'temperature_2m_min');
  const precipitation = asNumberArray(json.daily?.precipitation_sum, length, 'precipitation_sum');
  const probabilities = asOptionalNumberArray(
    json.daily?.precipitation_probability_max,
    length,
    'precipitation_probability_max'
  );
  const windSpeeds =
    json.daily?.wind_speed_10m_max == null
      ? Array<number | null>(length).fill(null)
      : asOptionalNumberArray(json.daily.wind_speed_10m_max, length, 'wind_speed_10m_max');

  const daily: DailyWeather[] = times.map((date, i) => {
    const rawCode = codes[i] ?? null;
    const tempMaxC = maxTemps[i]!;
    const tempMinC = minTemps[i]!;
    const precipitationMm = precipitation[i]!;
    const rawProbability = probabilities[i] ?? null;
    const rawWindSpeed = windSpeeds[i] ?? null;
    // An out-of-range code is as uninformative as a missing one — fall back to
    // the precipitation-derived wording rather than discarding the whole day.
    const weatherCode =
      rawCode !== null && Number.isInteger(rawCode) && rawCode >= 0 && rawCode <= 99
        ? rawCode
        : null;
    const precipitationProbabilityPct =
      rawProbability !== null && rawProbability >= 0 && rawProbability <= 100
        ? rawProbability
        : null;
    const windSpeedMaxKph = rawWindSpeed !== null && rawWindSpeed >= 0 ? rawWindSpeed : null;
    if (
      tempMaxC < -100 ||
      tempMaxC > 70 ||
      tempMinC < -100 ||
      tempMinC > 70 ||
      tempMinC > tempMaxC
    ) {
      throw new Error('Open-Meteo returned an out-of-range temperature');
    }
    if (precipitationMm < 0 || precipitationMm > 2000) {
      throw new Error('Open-Meteo returned out-of-range precipitation');
    }
    return {
      date,
      tempMaxC,
      tempMinC,
      precipitationMm,
      weatherCode,
      precipitationProbabilityPct,
      windSpeedMaxKph,
    };
  });

  return {
    latitude: json.latitude,
    longitude: json.longitude,
    timezone:
      typeof json.timezone === 'string' && json.timezone.trim() ? json.timezone : FARM_TIMEZONE,
    daily,
    fetched_at: new Date().toISOString(),
  };
}

/** Validate and upgrade cached data written by older app versions. */
export function normalizeCachedForecast(value: unknown): WeatherForecast | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<WeatherForecast> & { daily?: unknown };
  if (
    typeof raw.latitude !== 'number' ||
    typeof raw.longitude !== 'number' ||
    !isValidWeatherCoordinates(raw.latitude, raw.longitude) ||
    typeof raw.fetched_at !== 'string' ||
    Number.isNaN(new Date(raw.fetched_at).getTime()) ||
    !Array.isArray(raw.daily) ||
    raw.daily.length < 1 ||
    raw.daily.length > 7
  ) {
    return null;
  }

  const daily: DailyWeather[] = [];
  for (const item of raw.daily) {
    if (!item || typeof item !== 'object') return null;
    const day = item as Partial<DailyWeather>;
    if (
      !isValidDate(day.date) ||
      typeof day.tempMaxC !== 'number' ||
      !Number.isFinite(day.tempMaxC) ||
      typeof day.tempMinC !== 'number' ||
      !Number.isFinite(day.tempMinC) ||
      typeof day.precipitationMm !== 'number' ||
      !Number.isFinite(day.precipitationMm) ||
      day.tempMaxC < -100 ||
      day.tempMaxC > 70 ||
      day.tempMinC < -100 ||
      day.tempMinC > 70 ||
      day.tempMinC > day.tempMaxC ||
      day.precipitationMm < 0 ||
      day.precipitationMm > 2000
    ) {
      return null;
    }
    const weatherCode =
      typeof day.weatherCode === 'number' &&
      Number.isInteger(day.weatherCode) &&
      day.weatherCode >= 0 &&
      day.weatherCode <= 99
        ? day.weatherCode
        : null;
    const precipitationProbabilityPct =
      typeof day.precipitationProbabilityPct === 'number' &&
      Number.isFinite(day.precipitationProbabilityPct) &&
      day.precipitationProbabilityPct >= 0 &&
      day.precipitationProbabilityPct <= 100
        ? day.precipitationProbabilityPct
        : null;
    const windSpeedMaxKph =
      typeof day.windSpeedMaxKph === 'number' &&
      Number.isFinite(day.windSpeedMaxKph) &&
      day.windSpeedMaxKph >= 0
        ? day.windSpeedMaxKph
        : null;
    daily.push({
      date: day.date,
      tempMaxC: day.tempMaxC,
      tempMinC: day.tempMinC,
      precipitationMm: day.precipitationMm,
      weatherCode,
      precipitationProbabilityPct,
      windSpeedMaxKph,
    });
  }

  if (new Set(daily.map((day) => day.date)).size !== daily.length) return null;
  daily.sort((a, b) => a.date.localeCompare(b.date));
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    timezone:
      typeof raw.timezone === 'string' && raw.timezone.trim() ? raw.timezone : FARM_TIMEZONE,
    daily,
    fetched_at: raw.fetched_at,
  };
}

function cacheKey(lat: number, lng: number): string {
  // Four decimals (~11m latitude) avoid unrelated nearby plots sharing a key.
  return `${CACHE_KEYS.WEATHER}:${lat.toFixed(4)},${lng.toFixed(4)}`;
}

const STORAGE_PREFIX = `${KEYS.WEATHER}:${CACHE_KEYS.WEATHER}:`;
/** The shape `cacheKey` writes today — anything else under the prefix is stale. */
const CURRENT_STORAGE_KEY = new RegExp(`^${STORAGE_PREFIX}-?\\d+\\.\\d{4},-?\\d+\\.\\d{4}$`);

/**
 * The cache key used two decimals before this version, so every forecast a
 * previous install wrote is now unreadable and would never be overwritten or
 * removed. Sweeps them once; a failure costs nothing worth reporting, since the
 * only consequence is that a few stale keys survive.
 */
export async function pruneLegacyWeatherStorage(): Promise<void> {
  try {
    const keys = await safeGetAllKeys();
    const stale = keys.filter(
      (key) => key.startsWith(STORAGE_PREFIX) && !CURRENT_STORAGE_KEY.test(key)
    );
    await safeMultiRemove(stale);
  } catch (error) {
    logger.warn('pruneLegacyWeatherStorage: sweep failed', error as Error);
  }
}

let prunedLegacyKeys = false;

export function getCachedForecast(
  lat: number = KANYAKUMARI_LAT,
  lng: number = KANYAKUMARI_LNG
): WeatherForecast | null {
  if (!isValidWeatherCoordinates(lat, lng)) return null;
  return normalizeCachedForecast(peekCached<unknown>(cacheKey(lat, lng)));
}

/**
 * Coordinates of the most recent forecast the app resolved. Watering schedules
 * are computed synchronously deep in the task layer, which has no route to the
 * async location config — so rather than resolve coordinates a second way,
 * remember the ones the UI already asked for.
 *
 * Today and the Care Plan both fetch on mount, so this ends up holding exactly
 * the coordinates behind the rain badge: the scheduler and the badge cannot
 * disagree about whether rain is coming.
 */
let primaryCoords: { lat: number; lng: number } | null = null;

/**
 * The farm's current forecast, or null when none is cached yet.
 *
 * One farm-level forecast, not one per plot — the same simplification the Care
 * Plan already makes for its rain markers, and rain is a district-scale signal.
 * Null is a normal answer: offline, or before anything has fetched. Callers must
 * carry on without it rather than treat it as "no rain".
 */
export function getPrimaryForecast(): WeatherForecast | null {
  if (!primaryCoords) return null;
  return getCachedForecast(primaryCoords.lat, primaryCoords.lng);
}

export async function getWeatherForecast(
  lat: number = KANYAKUMARI_LAT,
  lng: number = KANYAKUMARI_LNG,
  options: WeatherFetchOptions = {}
): Promise<WeatherForecast | null> {
  if (!isValidWeatherCoordinates(lat, lng)) {
    throw new RangeError('Weather coordinates are outside valid latitude/longitude bounds');
  }
  primaryCoords = { lat, lng };
  const key = cacheKey(lat, lng);
  const cached = normalizeCachedForecast(peekCached<unknown>(key));
  if (
    !options.force &&
    cached &&
    Date.now() - new Date(cached.fetched_at).getTime() < WEATHER_FRESH_MS
  ) {
    return cached;
  }

  // Housekeeping, once per session and off the fetch path.
  if (!prunedLegacyKeys) {
    prunedLegacyKeys = true;
    void pruneLegacyWeatherStorage();
  }

  // `force` deliberately stays out of the dedup key. Past the freshness check
  // above, a forced and an unforced call issue the identical network request —
  // so joining one already in flight gives the caller equally fresh data for
  // one round trip instead of two. `force` buys a bypass of the cache, not a
  // guarantee of a private request.
  return dedup(key, async () => {
    try {
      const json = await withTimeoutAndRetry(
        async () => {
          const res = await fetch(buildUrl(lat, lng));
          if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
          return (await res.json()) as OpenMeteoResponse;
        },
        { timeoutMs: WEATHER_TIMEOUT_MS }
      );
      const forecast = parseOpenMeteoForecast(json);
      setCached(key, forecast);
      await safeSetItem(`${KEYS.WEATHER}:${key}`, JSON.stringify(forecast));
      return forecast;
    } catch (error) {
      logger.warn('getWeatherForecast: fetch failed, using cache', error as Error);
      const stored = await safeGetItem(`${KEYS.WEATHER}:${key}`);
      if (!stored) return cached;
      try {
        const fallback = normalizeCachedForecast(JSON.parse(stored));
        if (fallback) setCached(key, fallback);
        return fallback ?? cached;
      } catch {
        return cached;
      }
    }
  });
}

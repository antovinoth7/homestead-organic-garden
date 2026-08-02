/**
 * Weather service (Phase C, C.2) — Open-Meteo 7-day forecast.
 *
 * Open-Meteo is a free, key-less public API, so this skips the Firestore
 * auth/token dance but keeps the rest of the service contract: in-memory
 * freshness cache (3h), AsyncStorage offline fallback, and timeout+retry.
 */

import { WeatherForecast, DailyWeather } from '@/types/database.types';
import { safeGetItem, safeSetItem } from '@/utils/safeStorage';
import { KEYS } from '@/lib/storage';
import { withTimeoutAndRetry } from '@/utils/firestoreTimeout';
import { peekCached, setCached, dedup, CACHE_KEYS } from '@/lib/dataCache';
import { logger } from '@/utils/logger';

// Pure helpers live in weatherLogic (no native deps) — re-exported for callers.
export {
  hasRainSoon,
  isRainPredictedOnDate,
  resolveWeatherCoords,
  wateringAdvice,
} from './weatherLogic';
export type { WeatherCoords, WateringAdvice } from './weatherLogic';

/** Kanyakumari town — default until a per-plot lat/lng is supplied. */
export const KANYAKUMARI_LAT = 8.0883;
export const KANYAKUMARI_LNG = 77.5385;

/** Open-Meteo forecasts change slowly; refresh at most every 3 hours. */
/** Exported so callers can label a forecast older than this as cached/offline. */
export const WEATHER_FRESH_MS = 3 * 60 * 60 * 1000;

/** Open-Meteo on slow mobile data needs more headroom than Firestore reads. */
const WEATHER_TIMEOUT_MS = 15000;

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
}

function buildUrl(lat: number, lng: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'Asia/Kolkata',
    forecast_days: '7',
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function parseForecast(json: OpenMeteoResponse): WeatherForecast {
  const d = json.daily ?? {};
  const times = d.time ?? [];
  const daily: DailyWeather[] = times.map((date, i) => ({
    date,
    tempMaxC: d.temperature_2m_max?.[i] ?? 0,
    tempMinC: d.temperature_2m_min?.[i] ?? 0,
    precipitationMm: d.precipitation_sum?.[i] ?? 0,
  }));
  return {
    latitude: json.latitude,
    longitude: json.longitude,
    daily,
    fetched_at: new Date().toISOString(),
  };
}

function cacheKey(lat: number, lng: number): string {
  return `${CACHE_KEYS.WEATHER}:${lat.toFixed(2)},${lng.toFixed(2)}`;
}

/**
 * Synchronous in-memory cache read so UI can paint an already-fetched forecast
 * on first render (any age — `getWeatherForecast` revalidates by freshness).
 */
export function getCachedForecast(
  lat: number = KANYAKUMARI_LAT,
  lng: number = KANYAKUMARI_LNG
): WeatherForecast | null {
  return peekCached<WeatherForecast>(cacheKey(lat, lng));
}

/**
 * Fetch a 7-day forecast for the given coordinates (defaults to Kanyakumari).
 * Serves a fresh in-memory copy when available, otherwise fetches and falls
 * back to the last AsyncStorage copy on network failure.
 */
export async function getWeatherForecast(
  lat: number = KANYAKUMARI_LAT,
  lng: number = KANYAKUMARI_LNG
): Promise<WeatherForecast | null> {
  const key = cacheKey(lat, lng);

  // peek (not getCached): forecasts carry their own 3h freshness policy, which
  // the generic cache's 30s staleness window would otherwise defeat.
  const cached = peekCached<WeatherForecast>(key);
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < WEATHER_FRESH_MS) {
    return cached;
  }

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

      const forecast = parseForecast(json);
      setCached(key, forecast);
      await safeSetItem(`${KEYS.WEATHER}:${key}`, JSON.stringify(forecast));
      return forecast;
    } catch (error) {
      // Recoverable: the AsyncStorage fallback below serves the last forecast,
      // so a fetch failure is a warning, not an error-tracker event.
      logger.warn('getWeatherForecast: fetch failed, using cache', error as Error);
      const stored = await safeGetItem(`${KEYS.WEATHER}:${key}`);
      if (stored) {
        try {
          return JSON.parse(stored) as WeatherForecast;
        } catch {
          return null;
        }
      }
      return null;
    }
  });
}

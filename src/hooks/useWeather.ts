/**
 * Weather hook (Phase C, C.3). Wraps the weather service for the dashboard
 * WeatherCard with loading/error state and a rain-soon flag.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { WeatherForecast } from '@/types/database.types';
import {
  getWeatherForecast,
  getCachedForecast,
  hasRainSoon,
  KANYAKUMARI_LAT,
  KANYAKUMARI_LNG,
} from '@/services/weather';
import { logError } from '@/utils/errorLogging';

export interface UseWeatherResult {
  forecast: WeatherForecast | null;
  rainSoon: boolean;
  loading: boolean;
  error: string | null;
  refresh: (options?: { force?: boolean }) => Promise<void>;
}

export function useWeather(
  lat: number = KANYAKUMARI_LAT,
  lng: number = KANYAKUMARI_LNG
): UseWeatherResult {
  // Cache-first: paint an already-fetched forecast synchronously so remounts
  // and revisits never flash a loading state over data we already have.
  const [forecast, setForecast] = useState<WeatherForecast | null>(() =>
    getCachedForecast(lat, lng)
  );
  const [loading, setLoading] = useState(forecast === null);
  const [error, setError] = useState<string | null>(null);

  const hasDataRef = useRef(forecast !== null);
  useEffect(() => {
    hasDataRef.current = forecast !== null;
  }, [forecast]);

  const load = useCallback(
    async (options?: { force?: boolean }) => {
      // Only show the loading state on a true first fetch; with data on screen
      // this is a silent revalidate.
      if (!hasDataRef.current) setLoading(true);
      setError(null);
      try {
        const result = await getWeatherForecast(lat, lng, options);
        if (result) setForecast(result);
        else setError('Weather unavailable');
      } catch (err) {
        logError('network', 'useWeather: failed to load forecast', err as Error);
        setError('Weather unavailable');
      } finally {
        setLoading(false);
      }
    },
    [lat, lng]
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { forecast, rainSoon: hasRainSoon(forecast), loading, error, refresh: load };
}

/**
 * Weather hook (Phase C, C.3). Wraps the weather service for the dashboard
 * WeatherCard with loading/error state and a rain-soon flag.
 */

import { useState, useCallback, useEffect } from 'react';
import { WeatherForecast } from '@/types/database.types';
import {
  getWeatherForecast,
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
  refresh: () => void;
}

export function useWeather(
  lat: number = KANYAKUMARI_LAT,
  lng: number = KANYAKUMARI_LNG
): UseWeatherResult {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWeatherForecast(lat, lng);
      setForecast(result);
      if (!result) setError('Weather unavailable');
    } catch (err) {
      logError('network', 'useWeather: failed to load forecast', err as Error);
      setError('Weather unavailable');
    } finally {
      setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    load();
  }, [load]);

  return { forecast, rainSoon: hasRainSoon(forecast), loading, error, refresh: load };
}

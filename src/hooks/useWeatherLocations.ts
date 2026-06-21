/**
 * useWeatherLocations — resolves the set of plots the WeatherCard should show a
 * forecast for. Each plot gets coordinates via `resolveWeatherCoords` (plot GPS
 * → farm district → Kanyakumari default). With no plots configured it emits a
 * single fallback plot named after the district. Both reads are cached, so this
 * is cheap on the dashboard.
 */

import { useState, useEffect } from 'react';
import { getLocationConfig } from '@/services/locations';
import { getFarmConfig } from '@/services/farmCapacity';
import { resolveWeatherCoords } from '@/services/weather';

export interface WeatherPlot {
  name: string;
  lat: number;
  lng: number;
  source: 'plot' | 'district' | 'default';
}

export interface UseWeatherLocationsResult {
  plots: WeatherPlot[];
  loading: boolean;
}

export function useWeatherLocations(): UseWeatherLocationsResult {
  const [plots, setPlots] = useState<WeatherPlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [locationConfig, farmConfig] = await Promise.all([
          getLocationConfig(),
          getFarmConfig(),
        ]);
        if (!mounted) return;

        const district = farmConfig.district;
        const profiles = locationConfig.parentLocationProfiles ?? {};
        const parents = locationConfig.parentLocations ?? [];

        const built: WeatherPlot[] =
          parents.length > 0
            ? parents.map((name) => ({ name, ...resolveWeatherCoords(profiles[name], district) }))
            : [{ name: district ?? 'My Farm', ...resolveWeatherCoords(undefined, district) }];

        setPlots(built);
      } catch {
        if (mounted) {
          setPlots([{ name: 'My Farm', ...resolveWeatherCoords(undefined, undefined) }]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { plots, loading };
}

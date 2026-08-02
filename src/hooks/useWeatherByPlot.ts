/**
 * Forecasts for every plot at once, keyed by plot name.
 *
 * The Today screen shows a weather chip on each plot card. Mounting one
 * `useWeather` per card would give N independent loading states and N renders;
 * this fetches them in one `Promise.all` and commits once.
 *
 * Cache-first like `useWeather`: the initial state is seeded synchronously from
 * the in-memory cache, so revisits paint the chips in the same frame as the
 * cards rather than flashing empty.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { WeatherForecast } from '@/types/database.types';
import { getCachedForecast, getWeatherForecast } from '@/services/weather';
import type { WeatherPlot } from '@/hooks/useWeatherLocations';
import { logError } from '@/utils/errorLogging';

export interface UseWeatherByPlotResult {
  /** Plot name → forecast. Absent/`null` means nothing cached or fetched yet. */
  byPlotName: ReadonlyMap<string, WeatherForecast | null>;
  loading: boolean;
  refresh: () => void;
}

function seedFromCache(plots: WeatherPlot[]): Map<string, WeatherForecast | null> {
  const seeded = new Map<string, WeatherForecast | null>();
  for (const plot of plots) seeded.set(plot.name, getCachedForecast(plot.lat, plot.lng));
  return seeded;
}

export function useWeatherByPlot(plots: WeatherPlot[]): UseWeatherByPlotResult {
  // `useWeatherLocations` rebuilds its array each mount, so depend on the plots'
  // identity rather than the array's — otherwise every render refetches.
  const plotsKey = useMemo(
    () => plots.map((p) => `${p.name}:${p.lat},${p.lng}`).join('|'),
    [plots]
  );

  const [byPlotName, setByPlotName] = useState<Map<string, WeatherForecast | null>>(() =>
    seedFromCache(plots)
  );
  const [loading, setLoading] = useState(plots.length > 0);

  const load = useCallback(async () => {
    if (plots.length === 0) {
      setByPlotName(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);
    // One failing plot must not blank the others, hence the per-plot catch.
    // `getWeatherForecast` dedups by coordinate, so plots sharing district
    // coordinates cost a single request.
    const results = await Promise.all(
      plots.map((plot) =>
        getWeatherForecast(plot.lat, plot.lng).catch((err: unknown) => {
          logError('network', `useWeatherByPlot: ${plot.name} forecast failed`, err as Error);
          return null;
        })
      )
    );
    setByPlotName((prev) => {
      const next = new Map<string, WeatherForecast | null>();
      plots.forEach((plot, i) => {
        // Keep the cached copy rather than downgrading a painted chip to empty.
        next.set(plot.name, results[i] ?? prev.get(plot.name) ?? null);
      });
      return next;
    });
    setLoading(false);
    // `plots` is covered by `plotsKey` — depending on the array itself would
    // refetch on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plotsKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return { byPlotName, loading, refresh: load };
}

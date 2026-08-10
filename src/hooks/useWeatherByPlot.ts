/** Fetch and cache forecasts for multiple named plots in one state commit. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WeatherForecast } from '@/types/database.types';
import { getCachedForecast, getWeatherForecast } from '@/services/weather';
import type { WeatherPlot } from '@/hooks/useWeatherLocations';
import { logError } from '@/utils/errorLogging';

export interface WeatherRefreshOptions {
  force?: boolean;
  /** Omit to refresh every plot. */
  plotName?: string;
}

export interface UseWeatherByPlotResult {
  byPlotName: ReadonlyMap<string, WeatherForecast | null>;
  loading: boolean;
  refresh: (options?: WeatherRefreshOptions) => Promise<void>;
}

function seedFromCache(plots: WeatherPlot[]): Map<string, WeatherForecast | null> {
  const seeded = new Map<string, WeatherForecast | null>();
  for (const plot of plots) seeded.set(plot.name, getCachedForecast(plot.lat, plot.lng));
  return seeded;
}

export function useWeatherByPlot(plots: WeatherPlot[]): UseWeatherByPlotResult {
  const plotsKey = useMemo(
    () => plots.map((plot) => `${plot.name}:${plot.lat},${plot.lng}`).join('|'),
    [plots]
  );
  const [byPlotName, setByPlotName] = useState<Map<string, WeatherForecast | null>>(() =>
    seedFromCache(plots)
  );
  const [loading, setLoading] = useState(plots.length > 0);
  const generationRef = useRef(0);

  const refresh = useCallback(
    async (options: WeatherRefreshOptions = {}) => {
      const targets = options.plotName
        ? plots.filter((plot) => plot.name === options.plotName)
        : plots;
      if (targets.length === 0) {
        if (!options.plotName) setByPlotName(new Map());
        setLoading(false);
        return;
      }

      const generation = ++generationRef.current;
      setLoading(true);
      const results = await Promise.all(
        targets.map((plot) =>
          getWeatherForecast(plot.lat, plot.lng, { force: options.force }).catch((err: unknown) => {
            logError('network', `useWeatherByPlot: ${plot.name} forecast failed`, err as Error);
            return null;
          })
        )
      );
      if (generation !== generationRef.current) return;
      setByPlotName((previous) => {
        const next = options.plotName
          ? new Map(previous)
          : new Map<string, WeatherForecast | null>();
        targets.forEach((plot, index) => {
          next.set(plot.name, results[index] ?? previous.get(plot.name) ?? null);
        });
        return next;
      });
      setLoading(false);
    },
    // `plotsKey` captures every value used by the request without depending on
    // an array that callers may reconstruct on otherwise unrelated renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plotsKey]
  );

  useEffect(() => {
    void refresh();
    return () => {
      generationRef.current += 1;
    };
  }, [refresh]);

  return { byPlotName, loading, refresh };
}

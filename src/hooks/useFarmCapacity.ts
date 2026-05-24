import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { FarmConfig, Bed } from '@/types/database.types';
import {
  getFarmConfig,
  saveFarmConfig,
  calcUsableSqm,
  calcMaxBeds,
  calcWeeklyVegNeed,
  calcCategoryPct,
  getPhase3YearPlan,
  YearPlan,
} from '@/services/farmCapacity';
import { getBeds } from '@/services/beds';
import { logError } from '@/utils/errorLogging';

export interface CapacityMetrics {
  usableSqm: number;
  maxBeds: number;
  currentBedCount: number;
  weeklyVegNeedKg: number;
  categoryBreakdown: Record<string, number>;
  yearPlan: YearPlan[];
}

export interface UseFarmCapacityResult {
  config: FarmConfig | null;
  metrics: CapacityMetrics | null;
  beds: Bed[];
  loading: boolean;
  error: string | null;
  save: (config: FarmConfig) => Promise<void>;
  refresh: () => void;
}

export function useFarmCapacity(): UseFarmCapacityResult {
  const [config, setConfig] = useState<FarmConfig | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedConfig, fetchedBeds] = await Promise.all([getFarmConfig(), getBeds()]);
      setConfig(fetchedConfig);
      setBeds(fetchedBeds);
    } catch (err) {
      logError('network', 'useFarmCapacity: failed to load', err as Error);
      setError('Failed to load farm configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const metrics: CapacityMetrics | null = config
    ? (() => {
        const usableSqm = calcUsableSqm(config.land_cents ?? 0);
        const maxBeds = calcMaxBeds(usableSqm);
        return {
          usableSqm,
          maxBeds,
          currentBedCount: beds.length,
          weeklyVegNeedKg: calcWeeklyVegNeed(config.families_count),
          categoryBreakdown: {
            leafy: calcCategoryPct(beds, 'leafy'),
            fruiting: calcCategoryPct(beds, 'fruiting'),
            root_legume: calcCategoryPct(beds, 'root_legume'),
            spice: calcCategoryPct(beds, 'spice'),
            climber: calcCategoryPct(beds, 'climber'),
            coconut: calcCategoryPct(beds, 'coconut'),
          },
          yearPlan: getPhase3YearPlan(config),
        };
      })()
    : null;

  const save = useCallback(async (newConfig: FarmConfig) => {
    try {
      const saved = await saveFarmConfig(newConfig);
      setConfig(saved);
    } catch (err) {
      logError('network', 'useFarmCapacity: failed to save', err as Error);
      setError('Failed to save farm configuration');
    }
  }, []);

  return { config, metrics, beds, loading, error, save, refresh: load };
}

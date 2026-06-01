import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Bed, Plant } from '@/types/database.types';
import { getBeds } from '@/services/beds';
import { getAllPlants } from '@/services/plants';
import { isPlantArchived } from '@/utils/plantHelpers';
import { logError } from '@/utils/errorLogging';

export interface BedWithCoverage extends Bed {
  legume_coverage_pct: number;
  plant_count: number;
  active_plant_count: number;
}

interface UseBedDataResult {
  beds: BedWithCoverage[];
  loading: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => void;
}

function computeLegumePct(plants: Plant[]): number {
  if (plants.length === 0) return 0;
  const legumes = plants.filter((p) => p.crop_family === 'legume').length;
  return Math.round((legumes / plants.length) * 100);
}

export function useBedData(): UseBedDataResult {
  const [beds, setBeds] = useState<BedWithCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const [rawBeds, allPlants] = await Promise.all([getBeds(), getAllPlants()]);
      const enriched = rawBeds.map((bed) => {
        const bedPlants = allPlants.filter((p) => p.bed_id === bed.id && !p.is_deleted);
        return {
          ...bed,
          legume_coverage_pct: computeLegumePct(bedPlants),
          plant_count: bedPlants.length,
          active_plant_count: bedPlants.filter((p) => !isPlantArchived(p)).length,
        };
      });
      // Newest beds first.
      enriched.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
      setBeds(enriched);
    } catch (err) {
      logError('network', 'useBedData: failed to load beds', err as Error);
      setError('Failed to load beds');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { beds, loading, error, refresh: load };
}

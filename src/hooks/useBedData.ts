import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Bed, Plant } from '@/types/database.types';
import { getBeds } from '@/services/beds';
import { getAllPlants, getStoredPlants } from '@/services/plants';
import { isPlantArchived } from '@/utils/plantHelpers';
import { isPlantWaterOverdue } from '@/utils/plantWatering';
import { logError } from '@/utils/errorLogging';

export interface BedWithCoverage extends Bed {
  legume_coverage_pct: number;
  plant_count: number;
  active_plant_count: number;
  /** True when at least one active plant in the bed is due/overdue for watering. */
  water_overdue: boolean;
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
      // The bed list renders no plant images, so use the image-free, offline-first
      // plant reader (same one the dashboard uses) instead of getAllPlants, which
      // would needlessly paginate Firestore and resolve every plant's local image.
      // Fall back to the full fetch only on a cold cache so counts are never wrong.
      const [rawBeds, storedPlants] = await Promise.all([getBeds(), getStoredPlants()]);
      const allPlants = storedPlants.length > 0 ? storedPlants : await getAllPlants();
      const now = Date.now();

      // Group plants by bed once (O(N+M)) rather than filtering all plants per bed.
      const plantsByBed = new Map<string, Plant[]>();
      for (const p of allPlants) {
        if (p.is_deleted || !p.bed_id) continue;
        const list = plantsByBed.get(p.bed_id);
        if (list) list.push(p);
        else plantsByBed.set(p.bed_id, [p]);
      }

      const enriched = rawBeds.map((bed) => {
        const bedPlants = plantsByBed.get(bed.id) ?? [];
        const activePlants = bedPlants.filter((p) => !isPlantArchived(p));
        return {
          ...bed,
          legume_coverage_pct: computeLegumePct(bedPlants),
          plant_count: bedPlants.length,
          active_plant_count: activePlants.length,
          water_overdue: activePlants.some((p) => isPlantWaterOverdue(p, now)),
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

  // Show the spinner only on the first load; subsequent tab re-focuses refresh
  // silently so returning to the Beds tab feels instant.
  const hasLoadedRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      load({ silent: hasLoadedRef.current });
      hasLoadedRef.current = true;
    }, [load])
  );

  return { beds, loading, error, refresh: load };
}

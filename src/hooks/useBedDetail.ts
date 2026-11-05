import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Bed, Plant, RotationStatus } from '@/types/database.types';
import { getBed, getCrossBedStatus } from '@/services/beds';
import { getPlantsByBed } from '@/services/plants';
import { logError } from '@/utils/errorLogging';

interface UseBedDetailResult {
  bed: Bed | null;
  plants: Plant[];
  rotationStatus: RotationStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useBedDetail(bedId: string): UseBedDetailResult {
  const [bed, setBed] = useState<Bed | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [rotationStatus, setRotationStatus] = useState<RotationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The bed whose data is on screen. Only the first load of a bed shows the
  // full-screen spinner; a refocus or a post-action refresh updates in place —
  // the spinner used to unmount the top-down map and timeline every time.
  const loadedBedIdRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    const silent = loadedBedIdRef.current === bedId;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [fetchedBed, fetchedPlants] = await Promise.all([getBed(bedId), getPlantsByBed(bedId)]);
      setBed(fetchedBed);
      setPlants(fetchedPlants);

      if (fetchedBed) {
        const plantsByBedId: Record<string, Plant[]> = { [bedId]: fetchedPlants };
        const statuses = getCrossBedStatus([fetchedBed], plantsByBedId);
        setRotationStatus(statuses[0] ?? null);
      }
      loadedBedIdRef.current = bedId;
      if (silent) setError(null);
    } catch (err) {
      logError('network', 'useBedDetail: failed to load', err as Error, { bedId });
      // A failed background refresh keeps the bed on screen.
      if (!silent) setError('Failed to load bed');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [bedId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { bed, plants, rotationStatus, loading, error, refresh: load };
}

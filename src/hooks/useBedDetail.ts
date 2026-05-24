import { useState, useCallback } from 'react';
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedBed, fetchedPlants] = await Promise.all([getBed(bedId), getPlantsByBed(bedId)]);
      setBed(fetchedBed);
      setPlants(fetchedPlants);

      if (fetchedBed) {
        const plantsByBedId: Record<string, Plant[]> = { [bedId]: fetchedPlants };
        const statuses = getCrossBedStatus([fetchedBed], plantsByBedId);
        setRotationStatus(statuses[0] ?? null);
      }
    } catch (err) {
      logError('network', 'useBedDetail: failed to load', err as Error, { bedId });
      setError('Failed to load bed');
    } finally {
      setLoading(false);
    }
  }, [bedId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { bed, plants, rotationStatus, loading, error, refresh: load };
}

import { useState, useEffect } from 'react';
import { Plant, RotationStatus } from '@/types/database.types';
import { getCrossBedStatus } from '@/services/beds';
import { BedWithCoverage } from './useBedData';
import { getAllPlants } from '@/services/plants';
import { logError } from '@/utils/errorLogging';

interface UseCrossBedStatusResult {
  rotationStatuses: RotationStatus[];
  hasViolations: boolean;
  loading: boolean;
}

export function useCrossBedStatus(beds: BedWithCoverage[]): UseCrossBedStatusResult {
  const [rotationStatuses, setRotationStatuses] = useState<RotationStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (beds.length === 0) {
      setRotationStatuses([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getAllPlants()
      .then((allPlants: Plant[]) => {
        if (cancelled) return;
        const plantsByBedId: Record<string, Plant[]> = {};
        for (const plant of allPlants) {
          if (plant.bed_id) {
            if (!plantsByBedId[plant.bed_id]) plantsByBedId[plant.bed_id] = [];
            plantsByBedId[plant.bed_id]!.push(plant);
          }
        }
        const statuses = getCrossBedStatus(beds, plantsByBedId);
        setRotationStatuses(statuses);
      })
      .catch((err) => {
        if (!cancelled) logError('network', 'useCrossBedStatus failed', err as Error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [beds]);

  const hasViolations = rotationStatuses.some(
    (s) => s.has_solanaceae_violation || s.coordinator_checklist.some((r) => !r.passed)
  );

  return { rotationStatuses, hasViolations, loading };
}

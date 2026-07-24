import { useEffect, useMemo, useRef, useState } from 'react';
import { getPlantTaskLogs, getStoredTaskLogs } from '@/services/tasks';
import { mergePlantHistory } from '@/utils/plantHistory';
import type { PlantHistoryItem } from '@/utils/plantHistory';
import type { Plant, JournalEntry, TaskLog } from '@/types/database.types';

interface UsePlantHistoryParams {
  plant: Plant | null;
  journalEntries: JournalEntry[];
  /** Set true once the History tab has been opened; task logs load only then. */
  enabled: boolean;
}

interface PlantHistoryData {
  items: PlantHistoryItem[];
  loading: boolean;
  error: string | null;
}

/**
 * Builds the merged plant-history list. Journal entries, pest/disease records
 * and growth-stage changes come from data already loaded by usePlantDetail;
 * task logs are fetched lazily the first time `enabled` becomes true, via the
 * plant-scoped read so History never pulls the user's whole log collection.
 */
export function usePlantHistory({
  plant,
  journalEntries,
  enabled,
}: UsePlantHistoryParams): PlantHistoryData {
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || hasLoadedRef.current || !plant) return;
    hasLoadedRef.current = true;
    setLoading(true);
    void (async () => {
      // Paint locally-stored logs first so History appears instantly, then
      // refresh from the (cache-backed) network read.
      try {
        const stored = await getStoredTaskLogs();
        if (isMountedRef.current && stored.length > 0) {
          setTaskLogs(stored.filter((log) => log.plant_id === plant.id));
          setLoading(false);
        }
      } catch {
        // Ignore — the network read below is the source of truth.
      }
      try {
        const logs = await getPlantTaskLogs(plant.id);
        if (!isMountedRef.current) return;
        setTaskLogs(logs);
      } catch {
        if (!isMountedRef.current) return;
        setError('Could not load completed tasks.');
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    })();
  }, [enabled, plant]);

  const items = useMemo(
    () =>
      mergePlantHistory(
        journalEntries,
        plant?.pest_disease_history ?? [],
        plant?.growth_stage_history ?? [],
        taskLogs
      ),
    [journalEntries, plant, taskLogs]
  );

  return { items, loading, error };
}

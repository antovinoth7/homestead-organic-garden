import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getPlant, updatePlant } from '@/services/plants';
import { getTaskTemplates } from '@/services/tasks';
import { getJournalEntries } from '@/services/journal';
import { Plant, TaskTemplate, JournalEntry, JournalEntryType } from '@/types/database.types';
import { checkAndAdvanceStage, isPlantArchived } from '@/utils/plantHelpers';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { getErrorMessage } from '@/utils/errorLogging';

interface PlantDetailData {
  plant: Plant | null;
  tasks: TaskTemplate[];
  harvestEntries: JournalEntry[];
  loading: boolean;
  reload: (options?: { silent?: boolean }) => Promise<void>;
}

/**
 * Loads a plant with its tasks and harvest journal entries, auto-advancing the
 * growth stage when the computed stage differs from what is stored. Refreshes
 * silently whenever the screen regains focus.
 */
export function usePlantDetail(plantId: string | undefined): PlantDetailData {
  const navigation = useNavigation();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      if (isMountedRef.current && !options?.silent) {
        setLoading(true);
      }
      try {
        const [plantData, allTasks, allJournalEntries] = await Promise.all([
          getPlant(plantId ?? ''),
          getTaskTemplates(),
          getJournalEntries(),
        ]);

        if (!isMountedRef.current) return;

        setPlant(plantData);

        // Auto-advance growth stage if computed stage differs from stored stage
        if (plantData && !isPlantArchived(plantData)) {
          const profile = getPlantCareProfile(plantData.plant_variety ?? '', plantData.plant_type);
          const advancedStage = checkAndAdvanceStage(plantData, profile);
          if (advancedStage) {
            try {
              await updatePlant(plantData.id, { growth_stage: advancedStage });
              setPlant((prev) => (prev ? { ...prev, growth_stage: advancedStage } : prev));
            } catch {
              // Non-critical — stage will self-correct on next focus
            }
          }
        }

        setTasks(allTasks.filter((t) => t.plant_id === plantId));
        const plantHarvests = allJournalEntries
          .filter((e) => e.plant_id === plantId && e.entry_type === JournalEntryType.Harvest)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setHarvestEntries(plantHarvests);
      } catch (error: unknown) {
        if (!isMountedRef.current) return;
        if (!options?.silent) {
          Alert.alert('Error', getErrorMessage(error));
        }
      } finally {
        if (isMountedRef.current && !options?.silent) {
          setLoading(false);
        }
      }
    },
    [plantId]
  );

  useEffect(() => {
    isMountedRef.current = true;
    if (plantId) {
      void reload();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [plantId, reload]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isMountedRef.current && plantId) {
        void reload({ silent: true });
      }
    });
    return unsubscribe;
  }, [navigation, plantId, reload]);

  return { plant, tasks, harvestEntries, loading, reload };
}

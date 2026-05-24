import { Bed, Plant, TaskType, BedTaskSubtype } from '@/types/database.types';
import { auth, refreshAuthToken, db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import {
  withTimeoutAndRetry,
  FIRESTORE_WRITE_TIMEOUT_MS,
  FIRESTORE_READ_TIMEOUT_MS,
} from '@/utils/firestoreTimeout';
import { invalidate, CACHE_KEYS } from '@/lib/dataCache';
import { logger } from '@/utils/logger';
import { getAccumulatorByName } from '@/config/beds';

const TASKS_COLLECTION = 'task_templates';
const JEEVAMRUTHA_INTERVAL_DAYS = 21;
const WEEDING_INTERVAL_DAYS = 14;
const MULCH_INTERVAL_DAYS = 30;
const WOOD_ASH_INTERVAL_DAYS = 60;

interface BedTaskSpec {
  task_type: TaskType;
  task_subtype: BedTaskSubtype;
  frequency_days: number;
  label: string;
  conflict_note?: string;
}

function computeBedTasks(plants: Plant[]): BedTaskSpec[] {
  const tasks: BedTaskSpec[] = [];

  // Watering: minimum interval across all watering-enabled plants
  const wateringPlants = plants.filter(
    (p) => p.watering_enabled !== false && p.watering_frequency_days
  );
  if (wateringPlants.length > 0) {
    const intervals = wateringPlants.map((p) => p.watering_frequency_days ?? 3);
    const minWateringDays = Math.min(...intervals);
    const maxWateringDays = Math.max(...intervals);

    let conflictNote: string | undefined;
    if (maxWateringDays - minWateringDays > 3) {
      conflictNote = `Watering conflict: some plants need water every ${minWateringDays}d but others prefer every ${maxWateringDays}d. Using min interval.`;
    }

    tasks.push({
      task_type: 'water',
      task_subtype: 'water_bed',
      frequency_days: minWateringDays,
      label: `Water bed (every ${minWateringDays}d — driven by most water-needy plant)`,
      conflict_note: conflictNote,
    });
  }

  // Jeevamrutha: fixed schedule
  tasks.push({
    task_type: 'fertilise',
    task_subtype: 'jeevamrutha',
    frequency_days: JEEVAMRUTHA_INTERVAL_DAYS,
    label: 'Apply Jeevamrutha',
  });

  // Weeding: fixed
  tasks.push({
    task_type: 'spray',
    task_subtype: 'weeding',
    frequency_days: WEEDING_INTERVAL_DAYS,
    label: 'Weed bed',
  });

  // Wood ash: potassium supplement
  tasks.push({
    task_type: 'fertilise',
    task_subtype: 'wood_ash',
    frequency_days: WOOD_ASH_INTERVAL_DAYS,
    label: 'Apply wood ash (potassium)',
  });

  // Mulch check
  tasks.push({
    task_type: 'mulch',
    task_subtype: 'mulch',
    frequency_days: MULCH_INTERVAL_DAYS,
    label: 'Check and top up mulch',
  });

  // Dynamic accumulator chop-drop tasks
  for (const plant of plants) {
    const accumulator = getAccumulatorByName(plant.plant_variety ?? plant.name);
    if (accumulator) {
      tasks.push({
        task_type: 'prune',
        task_subtype: 'chop_and_drop',
        frequency_days: accumulator.chop_drop_interval_days,
        label: `Chop-drop ${accumulator.name} (${accumulator.nutrients_mined.join(', ')})`,
      });
    }
  }

  return tasks;
}

export async function syncBedTasks(bed: Bed, plants: Plant[]): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await refreshAuthToken();

  try {
    const specs = computeBedTasks(plants);

    // Fetch existing bed-level task templates for this bed
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('user_id', '==', user.uid),
      where('bed_id', '==', bed.id)
    );
    const existing = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });

    const existingBySubtype = new Map(
      existing.docs.map((d) => [d.data().task_subtype as BedTaskSubtype, d])
    );

    const now = new Date();

    for (const spec of specs) {
      const existingDoc = existingBySubtype.get(spec.task_subtype);
      const payload = {
        user_id: user.uid,
        plant_id: null,
        bed_id: bed.id,
        task_type: spec.task_type,
        task_subtype: spec.task_subtype,
        frequency_days: spec.frequency_days,
        preferred_time: null,
        enabled: true,
        next_due_at: now.toISOString(),
        priority_level: 'medium',
        created_at: now.toISOString(),
      };

      if (existingDoc) {
        await withTimeoutAndRetry(
          () =>
            updateDoc(doc(db, TASKS_COLLECTION, existingDoc.id), {
              frequency_days: spec.frequency_days,
              enabled: true,
            }),
          { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
        );
      } else {
        await withTimeoutAndRetry(() => addDoc(collection(db, TASKS_COLLECTION), payload), {
          timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
        });
      }
    }

    invalidate(CACHE_KEYS.TASK_TEMPLATES, CACHE_KEYS.TODAY_TASKS);
    logger.info(`syncBedTasks: synced ${specs.length} tasks for bed ${bed.id}`);
  } catch (error) {
    logger.warn('syncBedTasks failed', error as Error);
  }
}

/**
 * Convenience wrapper: loads bed + plants by bedId and syncs bed-level tasks.
 * Call after plants are added/removed from a bed.
 */
export async function syncBedTasksFromPlants(bedId: string): Promise<void> {
  const { getBed } = await import('@/services/beds');
  const { getPlantsByBed } = await import('@/services/plants');
  const bed = await getBed(bedId);
  if (!bed) return;
  const plants = await getPlantsByBed(bedId);
  await syncBedTasks(bed, plants);
}

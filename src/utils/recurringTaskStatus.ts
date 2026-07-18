import type { Plant, TaskTemplate, TaskType } from '../types/database.types';

/**
 * Maps a recurring task type to the plant-document toggle that is the source of
 * truth for whether that care is on. Task types without a plant toggle (e.g.
 * harvest, harvest_leaves) fall back to the template's own enabled flag.
 */
const TASK_TYPE_TO_PLANT_ENABLED_FIELD: Partial<Record<TaskType, keyof Plant>> = {
  water: 'watering_enabled',
  fertilise: 'fertilising_enabled',
  prune: 'pruning_enabled',
};

/**
 * A recurring task is Active only when both its own template flag and the
 * plant's toggle agree. Cross-checking the plant field means a care type the
 * user turned off always reads Inactive, even if a stale task template still
 * says enabled — the plant document is the source of truth for the toggle.
 */
export function isRecurringTaskActive(task: TaskTemplate, plant: Plant): boolean {
  if (!task.enabled) return false;
  const field = TASK_TYPE_TO_PLANT_ENABLED_FIELD[task.task_type];
  if (field && plant[field] === false) return false;
  return true;
}

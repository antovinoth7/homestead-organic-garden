import { TaskTemplate, Plant } from '@/types/database.types';

/**
 * Resolve the bed a task belongs to.
 *
 * Bed-level tasks carry `bed_id` directly; plant-level tasks inherit the bed of
 * their plant. Returns `null` when the task has no bed (e.g. pots / ground).
 */
export function resolveTaskBedId(
  task: Pick<TaskTemplate, 'bed_id' | 'plant_id'>,
  plantsById: ReadonlyMap<string, Pick<Plant, 'bed_id'>>
): string | null {
  return task.bed_id ?? (task.plant_id ? plantsById.get(task.plant_id)?.bed_id ?? null : null);
}

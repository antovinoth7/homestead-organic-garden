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

/**
 * A bed-level task (no plant, has a `bed_id`) whose bed no longer exists.
 *
 * These are left behind when a bed is deleted before the cascade ran; the Care
 * Plan hides them (and self-heals by deleting them) so they don't show as a
 * generic "General" task with no clue where to act. Plant-level tasks are
 * covered by the separate orphaned-plant cleanup, so they are never flagged here.
 */
export function isBedLevelOrphanTask(
  task: Pick<TaskTemplate, 'bed_id' | 'plant_id'>,
  liveBedIds: ReadonlySet<string>
): boolean {
  return !task.plant_id && task.bed_id != null && !liveBedIds.has(task.bed_id);
}

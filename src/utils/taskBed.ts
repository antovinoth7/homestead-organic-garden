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
 * These are left behind when a bed is deleted before the cascade ran. The Care
 * Plan hides them from its lists and calendar cells so they don't show as a
 * generic "General" task with no clue where to act — it does **not** delete
 * them. Absence from a `getBeds()` read is not evidence a bed was deleted (that
 * read is cached, can fall back to AsyncStorage, and once filtered live beds out
 * entirely), and acting on it destroyed real schedules. Removal happens only
 * through the explicit bed cascade in `beds.ts`. Plant-level tasks are never
 * flagged here; they are filtered out by their own plant lookup.
 */
export function isBedLevelOrphanTask(
  task: Pick<TaskTemplate, 'bed_id' | 'plant_id'>,
  liveBedIds: ReadonlySet<string>
): boolean {
  return !task.plant_id && task.bed_id != null && !liveBedIds.has(task.bed_id);
}

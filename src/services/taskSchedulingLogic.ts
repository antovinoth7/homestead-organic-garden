import type { Plant, TaskTemplate, TaskType } from '@/types/database.types';
import { EARLY_COMPLETION_BLOCK_REASON, TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';
import {
  addDaysToDateKey,
  calendarDaysBetweenKeys,
  farmDateKey,
  farmDateTimeFromKey,
} from '@/utils/farmDate';

/**
 * Pure care-task scheduling logic (no Firestore) — extracted from `tasks.ts`
 * so it can be unit-tested, mirroring the `alerts.ts` ↔ `alertsLogic.ts` split.
 */

export type PlantLastCareField =
  | 'last_watered_date'
  | 'last_fertilised_date'
  | 'last_pruned_date'
  | 'last_harvest_date';

export const TASK_TYPE_TO_PLANT_LAST_CARE_FIELD: Partial<Record<TaskType, PlantLastCareField>> = {
  water: 'last_watered_date',
  fertilise: 'last_fertilised_date',
  prune: 'last_pruned_date',
  harvest: 'last_harvest_date',
};

export const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const getLastCareDate = (plant: Plant, taskType: TaskType): string | null | undefined => {
  const field = TASK_TYPE_TO_PLANT_LAST_CARE_FIELD[taskType];
  return field ? plant[field] : null;
};

export const computeNextDueAt = (
  plant: Plant,
  taskType: TaskType,
  frequency: number,
  now: Date = new Date()
): string => {
  // No care history: seed from the planting date (same baseline as
  // getPlantWaterStatus) so the Care Plan agrees with the Home alerts.
  const base =
    parseDateValue(getLastCareDate(plant, taskType)) ||
    parseDateValue(plant.planting_date) ||
    parseDateValue(plant.created_at) ||
    now;

  const baseKey = farmDateKey(base) ?? farmDateKey(now);
  const nextKey = baseKey ? addDaysToDateKey(baseKey, frequency) : null;
  const nextDueAt = nextKey ? farmDateTimeFromKey(nextKey, TASK_DUE_TIME_HOUR) : null;

  // Cap at today so a plant already past its cycle shows "due today" instead
  // of overdue by the plant's whole age.
  const todayKey = farmDateKey(now);
  const todayDue = todayKey ? farmDateTimeFromKey(todayKey, TASK_DUE_TIME_HOUR) : null;
  if (!nextDueAt || !todayDue) return now.toISOString();
  if (nextDueAt < todayDue) return todayDue.toISOString();

  return nextDueAt.toISOString();
};

/**
 * Base date for a skip: whichever is later, now or the task's own due date.
 * Skipping means "not yet" — so it may only ever push a task later, never pull
 * a future task back towards today.
 */
export const skipBaseDate = (task: TaskTemplate, now: Date = new Date()): Date => {
  const due = parseDateValue(task.next_due_at);
  return new Date(Math.max(now.getTime(), due ? due.getTime() : now.getTime()));
};

/**
 * Skipping by N days lands on the app's 6 PM due-time convention, matching what
 * completing a task produces (see `buildTaskDoneOps`), so repeated skips don't
 * drift the schedule to whatever time of day the user happened to tap.
 */
export const computeSkipDate = (task: TaskTemplate, days: number, now: Date = new Date()): Date => {
  const baseKey = farmDateKey(skipBaseDate(task, now)) ?? farmDateKey(now);
  const nextKey = baseKey ? addDaysToDateKey(baseKey, days) : null;
  return (nextKey ? farmDateTimeFromKey(nextKey, TASK_DUE_TIME_HOUR) : null) ?? new Date(now);
};

/**
 * Whole calendar days a task is past due, or null when it isn't overdue —
 * including when it came due today, which is on time, not late.
 *
 * Both sides are floored to local midnight first. Due dates are stamped at
 * `TASK_DUE_TIME_HOUR` (6 PM), so subtracting raw timestamps and flooring the
 * result reports a task due yesterday evening as 0 days late — the schedule's
 * time-of-day convention silently eating the most common overdue case. Counting
 * calendar days is also what a farmer means by "two days late".
 */
export const calendarDaysOverdue = (task: TaskTemplate, now: Date = new Date()): number | null => {
  const dueKey = farmDateKey(task.next_due_at);
  const todayKey = farmDateKey(now);
  if (!dueKey || !todayKey || dueKey >= todayKey) return null;
  return calendarDaysBetweenKeys(dueKey, todayKey);
};

/** True when the task is due after today — i.e. the work isn't expected yet. */
export const isFutureTask = (task: TaskTemplate, now: Date = new Date()): boolean => {
  const dueKey = farmDateKey(task.next_due_at);
  const todayKey = farmDateKey(now);
  return dueKey !== null && todayKey !== null && dueKey > todayKey;
};

/**
 * True when completing this task now would do real harm — watering, fertilising
 * and spraying ahead of schedule. Due-today and overdue tasks are never blocked.
 */
export const isEarlyCompletionBlocked = (task: TaskTemplate, now: Date = new Date()): boolean =>
  EARLY_COMPLETION_BLOCK_REASON[task.task_type] != null && isFutureTask(task, now);

/**
 * Skipping means "this was due and I'm not doing it". A task that isn't due yet
 * has nothing to defer, so it is refused outright rather than silently pushed to
 * a date the farmer never had to act on. Unlike early completion this applies to
 * every task type, not just the harmful-if-early ones.
 */
export const isSkipBlocked = (task: TaskTemplate, now: Date = new Date()): boolean =>
  isFutureTask(task, now);

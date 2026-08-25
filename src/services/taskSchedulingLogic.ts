import type { Plant, TaskTemplate, TaskType } from '@/types/database.types';
import { EARLY_COMPLETION_BLOCK_REASON, TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';
import { getWateringFrequencyMultiplier } from '@/utils/seasonHelpers';
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

/**
 * Whether `syncCareTasksForPlant` may reshape this template.
 *
 * Sync gathers a plant's templates by `plant_id` and treats every one of them
 * as its own: it collapses "duplicates" by disabling all but the newest, and
 * rewrites `frequency_days` / `next_due_at` from the plant's care profile. A
 * task the farmer created by hand looks exactly like a duplicate to that logic,
 * so without this guard adding a manual water task and then saving the plant
 * silently reverted the manual cadence and switched the profile-driven task off.
 *
 * A missing `source` counts as auto — see the field's comment on why that is the
 * backwards-compatible default.
 */
export const isSyncOwnedTemplate = (template: Pick<TaskTemplate, 'source'>): boolean =>
  (template.source ?? 'auto') === 'auto';

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
 * The hour a template's due dates are stamped at, in farm wall-clock time.
 *
 * `preferred_time` is the farmer's choice of when in the day to do the work, so
 * it has to survive every reschedule. Completion and skip both re-derive the
 * due date from scratch, and both used to hard-code `TASK_DUE_TIME_HOUR` — so a
 * task created for the morning silently moved to 6 PM the first time it was
 * completed, while its card went on reading "Morning".
 */
export const dueHourForTemplate = (template: Pick<TaskTemplate, 'preferred_time'>): number => {
  if (template.preferred_time === 'morning') return 8;
  if (template.preferred_time === 'afternoon') return 14;
  return TASK_DUE_TIME_HOUR;
};

export interface CompletionSchedule {
  /**
   * When the task next comes due, or null if the date maths failed. A one-off
   * (frequency 0) lands on the completion day; the caller disables it instead
   * of scheduling it again.
   */
  nextDueAt: Date | null;
  /** Days actually applied, after any seasonal adjustment. */
  effectiveDays: number;
  /** The multiplier used, recorded on the plant so the overdue math can read it back. */
  wateringMultiplier: number | null;
}

/**
 * Where a task lands after it is completed.
 *
 * The farm zone sets the baseline cycle, but a forecast is advisory: an
 * unverified rain prediction must never silently extend the authoritative due
 * date. The UI presents rain/wind context and lets the farmer reschedule after
 * checking the local soil and crop.
 *
 * `plant` is the template's plant, or null for a bed-level or general task.
 * Watering is seasonally adjusted either way — a bed waters on the same cadence
 * as the plants in it, and gating the multiplier on `plant_id` (as this did
 * before it moved here) left bed watering tasks recurring at their raw interval
 * all year.
 */
export const computeScheduleAfterCompletion = (
  template: Pick<TaskTemplate, 'task_type' | 'frequency_days' | 'preferred_time' | 'bed_id'>,
  plant: Plant | null,
  doneAt: Date = new Date()
): CompletionSchedule => {
  const frequencyDays = Number.isFinite(template.frequency_days) ? template.frequency_days : 0;

  let effectiveDays = frequencyDays;
  let wateringMultiplier: number | null = null;
  if (template.task_type === 'water' && frequencyDays > 0) {
    // A bed-level water task has no plant to read a space type from; a bed is
    // one, so use it directly. A general task (neither plant nor bed) keeps the
    // raw interval — there is no growing space to season-adjust for.
    const spaceType = plant?.space_type ?? (template.bed_id ? 'bed' : null);
    if (spaceType) {
      wateringMultiplier = getWateringFrequencyMultiplier(spaceType, undefined, doneAt);
      effectiveDays = Math.max(1, Math.round(frequencyDays * wateringMultiplier));
    }
  }

  const doneKey = farmDateKey(doneAt);
  const nextKey = doneKey ? addDaysToDateKey(doneKey, effectiveDays) : null;
  const nextDueAt = nextKey ? farmDateTimeFromKey(nextKey, dueHourForTemplate(template)) : null;

  return { nextDueAt, effectiveDays, wateringMultiplier };
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
 * Skipping by N days lands on the task's own due hour, matching what completing
 * it produces (see `computeScheduleAfterCompletion`), so repeated skips don't
 * drift the schedule to whatever time of day the user happened to tap — or off
 * the morning slot the farmer chose.
 */
export const computeSkipDate = (task: TaskTemplate, days: number, now: Date = new Date()): Date => {
  const baseKey = farmDateKey(skipBaseDate(task, now)) ?? farmDateKey(now);
  const nextKey = baseKey ? addDaysToDateKey(baseKey, days) : null;
  return (nextKey ? farmDateTimeFromKey(nextKey, dueHourForTemplate(task)) : null) ?? new Date(now);
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

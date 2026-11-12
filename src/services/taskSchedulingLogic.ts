import type { Plant, TaskTemplate, TaskType } from '@/types/database.types';
import { EARLY_COMPLETION_BLOCK_REASON, TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { getWateringFrequencyMultiplier } from '@/utils/seasonHelpers';
import {
  addDaysToDateKey,
  calendarDaysBetweenKeys,
  farmDateKey,
  farmDateTimeFromKey,
} from '@/utils/farmDate';
import { HARVEST_TASK_TYPES } from '@/utils/harvestStats';
import { getCoconutAgeInfo, isPlantArchived } from '@/utils/plantHelpers';
import { getEffectiveWateringIntervalDays } from '@/utils/plantWatering';

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

export type CareIntervalField = 'watering' | 'fertilising' | 'pruning';

const CARE_INTERVAL_PLANT_FIELD: Record<CareIntervalField, keyof Plant> = {
  watering: 'watering_frequency_days',
  fertilising: 'fertilising_frequency_days',
  pruning: 'pruning_frequency_days',
};

const CARE_INTERVAL_PROFILE_FIELD: Record<
  CareIntervalField,
  'wateringFrequencyDays' | 'fertilisingFrequencyDays' | 'pruningFrequencyDays'
> = {
  watering: 'wateringFrequencyDays',
  fertilising: 'fertilisingFrequencyDays',
  pruning: 'pruningFrequencyDays',
};

/**
 * How often a care type should recur for this plant: the plant's own interval
 * when it has one, otherwise the default for its plant type.
 *
 * The plant document is not guaranteed to carry an interval. The add-plant
 * form only prefills the three frequency fields when its auto-suggest fires,
 * and that needs a variety to be chosen — so a plant saved without one, or
 * restored from a backup written before the fields existed, stores `null` for
 * all three. `syncCareTasksForPlant` then had nothing to schedule from and
 * created no tasks at all, which is what left Rebuild Care Schedule reporting
 * "0 created" with no way to recover a wiped Care Plan.
 *
 * Falling back to `getPlantCareProfile` uses the exact source the add-plant
 * form prefills from, so a rebuilt schedule matches what creating the plant
 * would have produced. The farmer's own care-profile overrides are not applied
 * — they live in a settings document the service layer does not load — so this
 * resolves to the built-in defaults, which is the right baseline for a
 * recovery action.
 *
 * Returns null only when the plant type is unrecognised. That means "unknown",
 * never "switched off": the on/off decision belongs to `*_enabled`, which the
 * caller checks separately and which always wins over a default.
 */
export const resolveCareInterval = (plant: Plant, field: CareIntervalField): number | null => {
  const own = plant[CARE_INTERVAL_PLANT_FIELD[field]];
  if (typeof own === 'number' && Number.isFinite(own) && own > 0) return own;

  const profile = getPlantCareProfile(plant.plant_variety ?? '', plant.plant_type);
  const fallback = profile?.[CARE_INTERVAL_PROFILE_FIELD[field]];
  return typeof fallback === 'number' && Number.isFinite(fallback) && fallback > 0
    ? fallback
    : null;
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
 * How a template changes once completed. A one-off (frequency 0 or less) is
 * switched off and stamped with the completion time; a recurring task moves to
 * its next due date. Empty when that date could not be computed.
 */
export const templateChangeAfterCompletion = (
  frequencyDays: number,
  nextDueAt: Date | null,
  doneAt: Date
): { enabled?: false; nextDueAt?: Date } => {
  if (frequencyDays <= 0) return { enabled: false, nextDueAt: doneAt };
  if (nextDueAt && !Number.isNaN(nextDueAt.getTime())) return { nextDueAt };
  return {};
};

/**
 * The last-care stamp a completion writes to its plant, or null when the task
 * type has no last-care field. A water completion also stamps the multiplier
 * it used, so the overdue math can read the decision back instead of
 * re-deriving it from a season (and a forecast) that have since moved on.
 */
export const plantCareStampAfterCompletion = (
  taskType: TaskType,
  doneAtIso: string,
  wateringMultiplier: number | null
): Partial<Plant> | null => {
  const field = TASK_TYPE_TO_PLANT_LAST_CARE_FIELD[taskType];
  if (!field) return null;
  return {
    [field]: doneAtIso,
    ...(wateringMultiplier !== null
      ? {
          last_watering_multiplier: wateringMultiplier,
          last_watering_adjustment: null,
        }
      : {}),
  };
};

/**
 * For one_shot annual plants: completing a harvest task auto-archives the
 * plant. Returns that plant's id, or null when nothing should be archived.
 */
export const oneShotArchivePlantId = (
  template: Pick<TaskTemplate, 'task_type' | 'plant_id'>,
  cachedPlants: Plant[]
): string | null => {
  if (template.task_type !== 'harvest' || !template.plant_id) return null;
  const harvestedPlant = cachedPlants.find((p) => p.id === template.plant_id);
  return harvestedPlant?.harvest_mode === 'one_shot' && !isPlantArchived(harvestedPlant)
    ? template.plant_id
    : null;
};

/** One care type `syncCareTasksForPlant` reconciles, with its on/off intent. */
export interface DesiredCareTask {
  taskType: TaskType;
  /** Interval in days — a positive finite number, or null when none could be resolved. */
  frequency: number | null;
  enabled: boolean;
}

const positiveOrNull = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;

/**
 * Every care type the plant could have a template for, with its on/off intent.
 * Disabled types are kept (not filtered out) so an existing template can be
 * flipped to enabled: false — otherwise turning a care type off would leave a
 * stale "Active" task on the Care Plan and detail screen.
 */
export const desiredCareTasks = (plant: Plant): DesiredCareTask[] => {
  const desired: { taskType: TaskType; frequency: number | null | undefined; enabled: boolean }[] =
    [
      {
        taskType: 'water',
        frequency: resolveCareInterval(plant, 'watering'),
        enabled: plant.watering_enabled !== false,
      },
      {
        taskType: 'fertilise',
        frequency: resolveCareInterval(plant, 'fertilising'),
        enabled: plant.fertilising_enabled !== false,
      },
      {
        taskType: 'prune',
        frequency: resolveCareInterval(plant, 'pruning'),
        enabled: plant.pruning_enabled !== false,
      },
    ];

  // For coconut trees, auto-derive a Harvest task from the tree's age.
  // harvestFrequencyDays === 0 means the tree is not yet bearing.
  if (plant.plant_type === 'coconut_tree' && plant.planting_date) {
    const ageInfo = getCoconutAgeInfo(plant.planting_date);
    if (ageInfo && ageInfo.harvestFrequencyDays > 0) {
      desired.push({
        taskType: 'harvest',
        frequency: ageInfo.harvestFrequencyDays,
        enabled: true,
      });
    }
  }

  // For perennial plants (Type 2), maintain a recurring "harvest_leaves" task
  // so the user is prompted to log leaf/produce weight on a fixed cycle.
  // Default 14-day cycle; permanent plants use their own harvest cadence (coconut above).
  if (plant.lifecycle_type === 'perennial') {
    desired.push({
      taskType: 'harvest_leaves',
      frequency: 14,
      enabled: true,
    });
  }

  return desired.map((item) => ({ ...item, frequency: positiveOrNull(item.frequency) }));
};

/**
 * When a sync-owned template of this type should next come due.
 *
 * Apply the farm zone's season multiplier for water tasks. frequencyDays
 * stored remains the user-configured base so the user's intent is preserved
 * across seasons; only next_due_at is adjusted. The shared helper keeps this
 * in step with the listing/alerts overdue math — and, because that helper
 * now prefers the multiplier recorded at the last watering, a plant keeps
 * the cadence it was actually put on rather than being re-derived into a
 * different one the moment the calendar crosses a season.
 */
export const careNextDueAt = (plant: Plant, taskType: TaskType, frequency: number): string => {
  const effectiveFrequency =
    taskType === 'water' ? (getEffectiveWateringIntervalDays(plant) ?? frequency) : frequency;
  return computeNextDueAt(plant, taskType, effectiveFrequency);
};

/**
 * The changes an existing sync-owned template needs to match its plant's care
 * profile — empty when it already does.
 */
export const careTemplateUpdates = (
  existing: TaskTemplate,
  plant: Plant,
  taskType: TaskType,
  frequency: number,
  nextDueAt: string
): Partial<TaskTemplate> => {
  const updates: Partial<TaskTemplate> = {};
  if (existing.frequency_days !== frequency) {
    updates.frequency_days = frequency;
    updates.next_due_at = nextDueAt;
  }
  if (!existing.enabled) {
    // Re-enabling always means the schedule is resuming after a pause — a
    // restored plant, or a care type switched back on — so the stored due
    // date is stale by however long the gap was. Re-base it, or a plant
    // restored after three months returns showing three months of overdue
    // work nobody was expected to do. `computeNextDueAt` caps at today, so
    // the task comes back due today rather than backdated.
    updates.enabled = true;
    updates.next_due_at = nextDueAt;
  }
  const plantCreatedAt = parseDateValue(plant.created_at);
  const existingDueDate = parseDateValue(existing.next_due_at);
  if (
    // No usable due date stored.
    !existingDueDate ||
    // Due date predates the plant itself.
    (plantCreatedAt && existingDueDate < plantCreatedAt) ||
    // Older builds seeded the first due date from "now" instead of the
    // planting date; pull never-completed tasks back into agreement.
    // Only for task types with a plant last-care field — completions of
    // other types (harvest_leaves) are invisible on the plant doc.
    (TASK_TYPE_TO_PLANT_LAST_CARE_FIELD[taskType] !== undefined &&
      !parseDateValue(getLastCareDate(plant, taskType)) &&
      existingDueDate > new Date(nextDueAt))
  ) {
    updates.next_due_at = nextDueAt;
  }
  return updates;
};

/**
 * An enabled template already covering the same work on the same target, or
 * null when there is none.
 *
 * Manual and auto templates deliberately coexist, so a second task of a type is
 * legitimate — this backs a confirmation, not a block, so that a duplicate is
 * something the farmer chose rather than something they ended up with. Both
 * sides are normalised to null so an absent field and an explicit null match.
 */
export const findDuplicateTemplate = (
  templates: readonly TaskTemplate[],
  candidate: Pick<TaskTemplate, 'task_type' | 'plant_id' | 'bed_id'>
): TaskTemplate | null =>
  templates.find(
    (template) =>
      template.enabled &&
      template.task_type === candidate.task_type &&
      (template.plant_id ?? null) === (candidate.plant_id ?? null) &&
      (template.bed_id ?? null) === (candidate.bed_id ?? null)
  ) ?? null;

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

/**
 * The harvest tasks a logged harvest should close for a plant.
 *
 * Logging a harvest in the journal used to leave the schedule untouched, so the
 * task it belonged to stayed overdue and the Today screen kept asking for work
 * the farmer had already done. This picks what to complete.
 *
 * Future tasks are excluded deliberately: completing one early rebases its whole
 * cycle onto today, which is exactly what `isFutureTask` guards against
 * everywhere else. A harvest logged before the crop was due records the yield
 * without silently rescheduling the rest of the season.
 */
export const selectDueHarvestTasks = (
  templates: TaskTemplate[],
  plantId: string,
  harvestedAt: string | Date
): TaskTemplate[] => {
  const harvestKey = farmDateKey(harvestedAt);
  if (!harvestKey) return [];
  return templates.filter((task) => {
    if (!task.enabled || task.plant_id !== plantId || !task.next_due_at) return false;
    if (!HARVEST_TASK_TYPES.has(task.task_type)) return false;
    const dueKey = farmDateKey(task.next_due_at);
    return dueKey !== null && dueKey <= harvestKey;
  });
};

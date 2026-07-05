import type { Plant, TaskType } from '@/types/database.types';
import { TASK_DUE_TIME_HOUR } from '@/utils/taskConstants';

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

  const nextDueAt = new Date(base);
  nextDueAt.setDate(nextDueAt.getDate() + frequency);
  nextDueAt.setHours(TASK_DUE_TIME_HOUR, 0, 0, 0);

  // Cap at today so a plant already past its cycle shows "due today" instead
  // of overdue by the plant's whole age.
  const todayDue = new Date(now);
  todayDue.setHours(TASK_DUE_TIME_HOUR, 0, 0, 0);
  if (nextDueAt < todayDue) return todayDue.toISOString();

  return nextDueAt.toISOString();
};

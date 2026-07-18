import type { Plant } from '@/types/database.types';
import { getWateringFrequencyMultiplier } from '@/utils/seasonHelpers';

/**
 * Whether a plant is due/overdue for watering, and why. Single source of truth
 * shared by the Today screen (per-plant attention) and the bed cards (a bed
 * "needs water" when any of its active plants does). Pure and Firebase-free.
 */
export interface PlantWaterStatus {
  /** Due today, overdue, or never watered but old enough to need it. */
  overdue: boolean;
  /** Days past the watering frequency; 0 when due today or at the no-history baseline. */
  daysOverdue: number;
  reason: 'overdue' | 'due_today' | 'no_history' | 'none';
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Whole calendar days between `dateValue` and `now` (both floored to local midnight). */
function calendarDaysSince(dateValue: string | null | undefined, now: number): number | null {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
}

/**
 * Effective days between waterings: the user-configured base interval scaled by
 * the Kanyakumari season multiplier for the plant's space type. This is the same
 * expression `syncCareTasksForPlant` applies to a water task's `next_due_at`, so
 * the listing/alerts overdue math and the Care Plan due date stay in agreement.
 * Returns null when watering is disabled or no valid base interval is set.
 */
export function getEffectiveWateringIntervalDays(plant: Plant): number | null {
  if (plant.watering_enabled === false) return null;
  const base = Number(plant.watering_frequency_days);
  if (!Number.isFinite(base) || base <= 0) return null;
  return Math.max(1, Math.round(base * getWateringFrequencyMultiplier(plant.space_type)));
}

export function getPlantWaterStatus(plant: Plant, now: number = Date.now()): PlantWaterStatus {
  const none: PlantWaterStatus = { overdue: false, daysOverdue: 0, reason: 'none' };

  const frequency = getEffectiveWateringIntervalDays(plant);
  if (frequency === null) return none;

  const daysSinceLastWatered = calendarDaysSince(plant.last_watered_date, now);
  if (daysSinceLastWatered !== null && daysSinceLastWatered >= frequency) {
    const daysOverdue = Math.max(0, daysSinceLastWatered - frequency);
    return { overdue: true, daysOverdue, reason: daysOverdue > 0 ? 'overdue' : 'due_today' };
  }

  // Watered recently enough — not yet due.
  if (plant.last_watered_date) return none;

  // No watering history: flag once the plant is older than its watering frequency.
  const plantAgeDays = calendarDaysSince(plant.planting_date || plant.created_at, now);
  if (plantAgeDays === null || plantAgeDays < frequency) return none;

  return {
    overdue: true,
    daysOverdue: Math.max(0, plantAgeDays - frequency),
    reason: 'no_history',
  };
}

export function isPlantWaterOverdue(plant: Plant, now: number = Date.now()): boolean {
  return getPlantWaterStatus(plant, now).reason !== 'none';
}

/**
 * Whole calendar days since the plant was last watered (midnight-floored), or
 * null when there is no watering history. Same day counting as the overdue
 * logic above, so informational labels and the overdue state never disagree.
 */
export function daysSinceLastWatered(plant: Plant, now: number = Date.now()): number | null {
  return calendarDaysSince(plant.last_watered_date, now);
}

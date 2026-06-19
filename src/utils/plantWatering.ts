import type { Plant } from '@/types/database.types';

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

export function getPlantWaterStatus(plant: Plant, now: number = Date.now()): PlantWaterStatus {
  const none: PlantWaterStatus = { overdue: false, daysOverdue: 0, reason: 'none' };

  const frequency = Number(plant.watering_frequency_days);
  if (!Number.isFinite(frequency) || frequency <= 0) return none;

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

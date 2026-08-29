import type { Plant, TaskType } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
import {
  getCurrentSeason,
  getSeasonLabel,
  getWateringFrequencyMultiplier,
  shortenSeasonLabel,
} from '@/utils/seasonHelpers';
import { getSeasonIconKey } from '@/config/iconRegistry';

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
 * The date a plant's current watering schedule was set on. Mirrors the base
 * chain `computeNextDueAt` uses, so the two agree about which day a plant's
 * cycle counts from.
 */
function scheduleReferenceDate(plant: Plant, now: number): Date {
  for (const value of [plant.last_watered_date, plant.planting_date, plant.created_at]) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date(now);
}

/**
 * Effective days between waterings: the user-configured base interval scaled by
 * the multiplier in force when the plant was last watered.
 *
 * That multiplier is read back from `last_watering_multiplier` rather than
 * recomputed. Recomputing is what made this disagree with the Care Plan:
 * `buildTaskDoneOps` freezes a due date at completion, while this re-derived an
 * interval from *today's* season — so at a season boundary every plant flipped
 * overdue while its task still showed a due date a week out. Once the multiplier
 * also reflects a forecast, recomputation is not merely inconsistent but
 * impossible, since that forecast has rolled out of its seven-day window.
 *
 * Plants watered before this field existed, and plants never watered at all,
 * fall back to the season multiplier as of the date their schedule was set.
 * Returns null when watering is disabled or no valid base interval is set.
 */
export function getEffectiveWateringIntervalDays(
  plant: Plant,
  now: number = Date.now()
): number | null {
  if (plant.watering_enabled === false) return null;
  const base = Number(plant.watering_frequency_days);
  if (!Number.isFinite(base) || base <= 0) return null;

  const recorded = plant.last_watering_multiplier;
  const multiplier =
    typeof recorded === 'number' && Number.isFinite(recorded) && recorded > 0
      ? recorded
      : getWateringFrequencyMultiplier(
          plant.space_type,
          undefined,
          scheduleReferenceDate(plant, now)
        );

  return Math.max(1, Math.round(base * multiplier));
}

export function getPlantWaterStatus(plant: Plant, now: number = Date.now()): PlantWaterStatus {
  const none: PlantWaterStatus = { overdue: false, daysOverdue: 0, reason: 'none' };

  const frequency = getEffectiveWateringIntervalDays(plant, now);
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

export interface WateringCycleNote {
  iconKey: VisualIconKey;
  text: string;
}

/**
 * One line explaining why this watering cycle is not simply the base interval
 * the user configured.
 *
 * A water task almost never runs at its bare `frequency_days` — the season
 * stretches or shortens it, and the forecast corrects that again — so showing
 * only "Every 3 days" states something the app does not actually do. Returns
 * null when there is nothing to explain: a non-water task, or a cycle that did
 * land on the base interval.
 */
export function describeWateringCycle(
  plant: Plant | undefined,
  taskType: TaskType,
  baseDays: number | null | undefined,
  now: number = Date.now()
): WateringCycleNote | null {
  if (taskType !== 'water' || !plant) return null;
  const base = Number(baseDays);
  if (!Number.isFinite(base) || base <= 0) return null;

  const effective = getEffectiveWateringIntervalDays(plant, now);
  if (effective === null || effective === base) return null;

  const cycle = `${effective} day${effective === 1 ? '' : 's'} this cycle`;
  switch (plant.last_watering_adjustment) {
    case 'rain':
      return { iconKey: 'weather.rain', text: `${cycle} — rain expected` };
    case 'dry':
      return { iconKey: 'weather.clear', text: `${cycle} — little rain forecast` };
    default: {
      const reference = scheduleReferenceDate(plant, now);
      return {
        iconKey: getSeasonIconKey(getCurrentSeason(reference)),
        text: `${cycle} — ${shortenSeasonLabel(getSeasonLabel(reference))}`,
      };
    }
  }
}

/**
 * Whole calendar days since the plant was last watered (midnight-floored), or
 * null when there is no watering history. Same day counting as the overdue
 * logic above, so informational labels and the overdue state never disagree.
 */
export function daysSinceLastWatered(plant: Plant, now: number = Date.now()): number | null {
  return calendarDaysSince(plant.last_watered_date, now);
}

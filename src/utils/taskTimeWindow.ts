import type { TaskTemplate, TaskType } from '@/types/database.types';

/**
 * The part of the day a best-time window sits in. `any` windows ("After
 * watering", "Dry weather") are about conditions, not the clock, so they never
 * clash with a time the farmer chose.
 */
export type BestTimeSlot = 'morning' | 'evening' | 'any';

export interface TaskBestTime {
  /** Chip text, e.g. "Before 10 AM". */
  label: string;
  /** One sentence for the detail sheet: why this window. */
  reason: string;
  /** Chip colour family — warm for morning / any-time, cool for evening. */
  tone: 'warm' | 'cool';
  slot: BestTimeSlot;
}

const WATER_EVENING: TaskBestTime = {
  label: 'After 4 PM',
  reason: 'Evening watering suits plants that wilt in the afternoon heat.',
  tone: 'cool',
  slot: 'evening',
};

/**
 * Field-practice timing per task type. These are the windows the Care Plan
 * prints on a card — general organic-gardening practice for hot, humid Tamil
 * Nadu conditions, documented in docs/DOMAIN_LOGIC.md → Best-time windows.
 * Types without an entry (repot, mulch, weeding, cultivating) carry no claim.
 */
export const TASK_BEST_TIME: Partial<Record<TaskType, TaskBestTime>> = {
  water: {
    label: 'Before 10 AM',
    reason: 'Less water is lost to heat and wind in the cool morning.',
    tone: 'warm',
    slot: 'morning',
  },
  spray: {
    label: 'After 4 PM',
    reason:
      'Organic sprays such as neem break down in strong sun, and bees are less active in the evening.',
    tone: 'cool',
    slot: 'evening',
  },
  fertilise: {
    label: 'After watering',
    reason: 'Feed on moist soil so roots take it up and do not burn.',
    tone: 'warm',
    slot: 'any',
  },
  harvest: {
    label: 'Before 9 AM',
    reason: 'Picked in the cool hours, produce stays fresh longer.',
    tone: 'warm',
    slot: 'morning',
  },
  harvest_leaves: {
    label: 'Before 9 AM',
    reason: 'Leaves are crisp before the sun wilts them.',
    tone: 'warm',
    slot: 'morning',
  },
  transplanting: {
    label: 'After 4 PM',
    reason: 'Seedlings settle overnight with less wilting.',
    tone: 'cool',
    slot: 'evening',
  },
  prune: {
    label: 'Dry weather',
    reason: 'Cuts heal faster and fungus spreads less when it is dry.',
    tone: 'warm',
    slot: 'any',
  },
};

const slotOfPreferredTime = (preferred: string | null | undefined): BestTimeSlot | null => {
  if (preferred === 'morning') return 'morning';
  if (preferred === 'evening') return 'evening';
  // Afternoon is neither window: it clashes with both clock-bound slots.
  if (preferred === 'afternoon') return null;
  return 'any';
};

/**
 * The best-time window to print for a task, or null when there is none to show.
 *
 * The farmer's own `preferred_time` wins over the table: a watering they set for
 * the evening reads "After 4 PM", and any other clash (a harvest they set for
 * the evening) drops the chip so the card shows their time instead.
 */
export function taskBestTime(
  task: Pick<TaskTemplate, 'task_type' | 'preferred_time'>
): TaskBestTime | null {
  const preferred = task.preferred_time ?? null;
  if (task.task_type === 'water' && preferred === 'evening') return WATER_EVENING;

  const window = TASK_BEST_TIME[task.task_type];
  if (!window) return null;
  if (!preferred || window.slot === 'any') return window;

  const preferredSlot = slotOfPreferredTime(preferred);
  return preferredSlot === window.slot ? window : null;
}

const PREFERRED_TIME_LABELS: Record<string, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
};

/** "Morning" / "Afternoon" / "Evening" for a set `preferred_time`, else null. */
export function preferredTimeLabel(preferred: string | null | undefined): string | null {
  return preferred ? (PREFERRED_TIME_LABELS[preferred] ?? null) : null;
}

/**
 * Whether the card's meta line should still name the farmer's chosen time:
 * only when no chip already says when (no window, or one that is about
 * conditions rather than the clock).
 */
export function showPreferredTimeInMeta(
  task: Pick<TaskTemplate, 'task_type' | 'preferred_time'>
): boolean {
  if (!preferredTimeLabel(task.preferred_time)) return false;
  const best = taskBestTime(task);
  return !best || best.slot === 'any';
}

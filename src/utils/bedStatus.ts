import type { Theme } from '@/theme/colors';
import type { BedWithCoverage } from '@/hooks/useBedData';
import { bedExpectsLegumes } from '@/config/beds/legumeRelevance';
import { LOW_LEGUME_THRESHOLD } from '@/utils/filterAndSortBeds';

/** An active (growing) bed not watered within this many days is flagged overdue. */
export const WATER_OVERDUE_DAYS = 3;

export type BedLifecycle = 'empty' | 'growing' | 'resting' | 'permanent';

export type BedAttentionReason =
  | 'rotation_violation'
  | 'overdue_water'
  | 'rest_complete'
  | 'low_legume';

export interface BedStatus {
  lifecycle: BedLifecycle;
  /** Days until the rest period ends; null when not resting or already complete. */
  restDaysRemaining: number | null;
  /** Resting, but the rest period has elapsed — the bed is effectively ready. */
  restComplete: boolean;
  /** Actionable issues; empty when nothing needs the grower's attention. */
  attention: BedAttentionReason[];
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysSince(iso: string | null | undefined, now: number): number | null {
  if (!iso) return null;
  return Math.floor((now - new Date(iso).getTime()) / MS_PER_DAY);
}

/**
 * Derive a bed's lifecycle state and any actionable attention flags from the
 * fields already stored on the bed. Pure and Firebase-free so the listing, the
 * detail screen, and tests can all share one source of truth.
 */
export function getBedStatus(bed: BedWithCoverage, now: number = Date.now()): BedStatus {
  const restUntilMs = bed.resting_until != null ? new Date(bed.resting_until).getTime() : null;
  const restComplete = !!bed.is_resting && restUntilMs != null && restUntilMs <= now;
  const restDaysRemaining =
    bed.is_resting && restUntilMs != null && !restComplete
      ? Math.max(0, Math.ceil((restUntilMs - now) / MS_PER_DAY))
      : null;

  // Lifecycle precedence: permanent > resting > empty > growing.
  let lifecycle: BedLifecycle;
  if (bed.is_permanent) lifecycle = 'permanent';
  else if (bed.is_resting) lifecycle = 'resting';
  else if (bed.active_plant_count === 0) lifecycle = 'empty';
  else lifecycle = 'growing';

  const attention: BedAttentionReason[] = [];
  if (lifecycle !== 'permanent' && bed.prev_crop_family === 'solanaceae') {
    attention.push('rotation_violation');
  }
  if (lifecycle === 'growing') {
    const sinceWater = daysSince(bed.last_water_date, now);
    if (sinceWater === null || sinceWater > WATER_OVERDUE_DAYS) attention.push('overdue_water');
  }
  if (lifecycle === 'resting' && restComplete) attention.push('rest_complete');
  if (
    bedExpectsLegumes(bed.type) &&
    bed.legume_coverage_pct < LOW_LEGUME_THRESHOLD &&
    bed.plant_count > 0
  ) {
    attention.push('low_legume');
  }

  return { lifecycle, restDaysRemaining, restComplete, attention };
}

/** Attention reasons that warrant the urgent (red) treatment vs the advisory (amber) one. */
const URGENT_ATTENTION: ReadonlySet<BedAttentionReason> = new Set([
  'rotation_violation',
  'overdue_water',
]);

export function hasUrgentAttention(attention: BedAttentionReason[]): boolean {
  return attention.some((r) => URGENT_ATTENTION.has(r));
}

/** Short, grower-facing label for each attention reason — shown on the bed card. */
export const ATTENTION_LABEL: Record<BedAttentionReason, string> = {
  rotation_violation: 'Rotation risk',
  overdue_water: 'Needs water',
  rest_complete: 'Rest done',
  low_legume: 'Low legume',
};

/**
 * The single reason most worth surfacing on a compact card: urgent reasons win, otherwise
 * the first flagged reason. Returns null when nothing needs attention.
 */
export function primaryAttention(attention: BedAttentionReason[]): BedAttentionReason | null {
  if (attention.length === 0) return null;
  return attention.find((r) => URGENT_ATTENTION.has(r)) ?? attention[0]!;
}

// ─── Presentation maps (theme-token keys, resolved by the card for dark mode) ──

/** Theme keys whose value is a plain color string (excludes structured tokens). */
export type ColorToken = { [K in keyof Theme]: Theme[K] extends string ? K : never }[keyof Theme];

export const LIFECYCLE_LABEL: Record<BedLifecycle, string> = {
  empty: 'Ready to plant',
  growing: 'Growing',
  resting: 'Resting',
  permanent: 'Permanent',
};

export const LIFECYCLE_STRIPE_TOKEN: Record<BedLifecycle, ColorToken> = {
  empty: 'accent',
  growing: 'success',
  resting: 'purpleDark',
  permanent: 'info',
};

export const LIFECYCLE_PILL_BG_TOKEN: Record<BedLifecycle, ColorToken> = {
  empty: 'accentLight',
  growing: 'primaryLight',
  resting: 'purpleLight',
  permanent: 'infoLight',
};

export const LIFECYCLE_PILL_TEXT_TOKEN: Record<BedLifecycle, ColorToken> = {
  empty: 'accent',
  growing: 'primary',
  resting: 'purpleDark',
  permanent: 'infoDark',
};

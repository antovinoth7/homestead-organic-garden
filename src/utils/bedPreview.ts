/**
 * Bed preview derivations for the home-screen bed cards.
 *
 * The card leads with a grid-paper tile carrying the bed's own plant emoji, so
 * a bed reads as "three chillies" rather than "3 planted". Both derivations run
 * over plants the caller has already grouped by bed (see `useBedData`), so this
 * costs no extra reads — it is pure so the card, the hook, and tests share one
 * source of truth.
 */

import type { GrowthStage, Plant } from '@/types/database.types';
import type { BedWithCoverage } from '@/hooks/useBedData';
import { STAGE_ORDER } from '@/utils/plantHelpers';
import { LIFECYCLE_LABEL, type BedStatus } from '@/utils/bedStatus';

/** Pins that fit across the mini grid tile before it reads as clutter. */
export const MAX_PREVIEW_PINS = 3;

export interface BedPreview {
  /** Plant names for the first MAX_PREVIEW_PINS thumbnails, in bed display order. */
  plantNames: string[];
  /** The stage most of the bed is in; null when no plant has a recorded stage. */
  dominantStage: GrowthStage | null;
}

/** Plants without a `sort_order` sink below the ordered ones rather than jumping to the front. */
const UNSORTED = Number.MAX_SAFE_INTEGER;

/**
 * The plant's stage as the grower sees it: a pinned stage is a manual override
 * and always wins over the auto-progressed one.
 */
function recordedStage(plant: Plant): GrowthStage | null {
  return plant.growth_stage_pinned ?? plant.growth_stage ?? null;
}

/**
 * Pick the stage held by the most plants. Ties break towards the later stage in
 * STAGE_ORDER — a bed that is half vegetative and half fruiting is the more
 * useful thing to call "Fruiting".
 */
function pickDominantStage(plants: Plant[]): GrowthStage | null {
  const counts = new Map<GrowthStage, number>();
  for (const plant of plants) {
    const stage = recordedStage(plant);
    if (stage === null) continue;
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  let best: GrowthStage | null = null;
  let bestCount = 0;
  for (const [stage, count] of counts) {
    if (best === null || count > bestCount) {
      best = stage;
      bestCount = count;
      continue;
    }
    if (count === bestCount && STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(best)) {
      best = stage;
    }
  }
  return best;
}

/**
 * Build the grid pins and stage badge for one bed from its active plants.
 *
 * Duplicate emoji are kept: a spice bed of three chillies should render
 * repeated identical markers, which is what the bed actually looks like.
 */
export function buildBedPreview(activePlants: Plant[]): BedPreview {
  const ordered = [...activePlants].sort((a, b) => {
    const byOrder = (a.sort_order ?? UNSORTED) - (b.sort_order ?? UNSORTED);
    if (byOrder !== 0) return byOrder;
    return a.name.localeCompare(b.name);
  });

  return {
    plantNames: ordered.slice(0, MAX_PREVIEW_PINS).map((plant) => plant.name),
    dominantStage: pickDominantStage(activePlants),
  };
}

/**
 * The bed card's status chip label, most urgent first: something to do today
 * outranks where the bed is in its life, which outranks the plain lifecycle.
 */
export function bedCardStatusLabel(
  bed: BedWithCoverage,
  status: BedStatus,
  dominantStage: GrowthStage | null
): string {
  if (bed.water_overdue) return 'Due water';
  if (status.lifecycle === 'resting') {
    return status.restComplete ? 'Rest done' : `Resting · ${status.restDaysRemaining ?? 0}d`;
  }
  if (status.lifecycle === 'growing' && dominantStage === 'fruiting') return 'Fruiting';
  return LIFECYCLE_LABEL[status.lifecycle];
}

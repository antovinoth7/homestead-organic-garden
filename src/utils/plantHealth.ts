/**
 * Plant health aggregation for the Home dashboard (Phase C).
 *
 * Pure, dependency-free summary of plant health states. Extracted from the
 * inline `stats` memo that used to live in `TodayScreen` so it can be reused
 * by `DashboardHero` and unit-tested.
 */

import { Plant } from '@/types/database.types';
import { isPlantArchived } from '@/utils/plantHelpers';

export interface PlantHealthSummary {
  healthy: number;
  stressed: number;
  recovering: number;
  sick: number;
  total: number;
}

/**
 * Count active plants by health bucket — one bucket per `HealthStatus`, with an
 * unset status counting as healthy. `recovering` is its own bucket rather than
 * part of healthy: it is a status a grower sets deliberately, the plant list
 * filters by it separately, and folding it in hid it from the plot cards
 * entirely.
 *
 * Soft-deleted and archived plants are ignored — the same active-plant filter
 * `alertsLogic` applies, so the cards and the alert rail can't report different
 * populations.
 */
export function getPlantHealthSummary(plants: Plant[]): PlantHealthSummary {
  const active = plants.filter((p) => !p.is_deleted && !isPlantArchived(p));
  let healthy = 0;
  let stressed = 0;
  let recovering = 0;
  let sick = 0;

  for (const plant of active) {
    if (plant.health_status === 'sick') {
      sick += 1;
    } else if (plant.health_status === 'stressed') {
      stressed += 1;
    } else if (plant.health_status === 'recovering') {
      recovering += 1;
    } else {
      // null or 'healthy'
      healthy += 1;
    }
  }

  return { healthy, stressed, recovering, sick, total: active.length };
}

/**
 * Plants growing in pots or straight in the ground — anything not assigned to a
 * bed.
 *
 * The Today plot cards count this set rather than every plant on the plot,
 * because tapping a health count opens the plant list, and that list opens on
 * its "Pots & Ground" segment. Counting bed plants here would state a figure
 * the next screen cannot show. Bed plants are represented on the card by the
 * bed count, which routes to the Beds tab instead.
 */
export function filterPotAndGround<T extends { bed_id?: string | null }>(plants: T[]): T[] {
  return plants.filter((plant) => !plant.bed_id);
}

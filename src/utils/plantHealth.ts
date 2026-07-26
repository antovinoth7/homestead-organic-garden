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
  sick: number;
  total: number;
}

/**
 * Count active plants by health bucket. Plants with no status, `healthy`, or
 * `recovering` count as healthy. Soft-deleted and archived plants are ignored —
 * the same active-plant filter `alertsLogic` applies, so the hero's Sick tile
 * and the alert rail can't report different populations.
 */
export function getPlantHealthSummary(plants: Plant[]): PlantHealthSummary {
  const active = plants.filter((p) => !p.is_deleted && !isPlantArchived(p));
  let healthy = 0;
  let stressed = 0;
  let sick = 0;

  for (const plant of active) {
    if (plant.health_status === 'sick') {
      sick += 1;
    } else if (plant.health_status === 'stressed') {
      stressed += 1;
    } else {
      // null, 'healthy', or 'recovering'
      healthy += 1;
    }
  }

  return { healthy, stressed, sick, total: active.length };
}

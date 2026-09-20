/**
 * Bed lifecycle tally for one plot — the bed strip on the Today plot card.
 *
 * The card's bed strip states the same beds `bedCount` totals, split by
 * lifecycle, so the four figures must add up to the total. Buckets come from
 * `getBedLifecycle`, which the bed list and bed detail already use, so a bed
 * reads the same here as it does there.
 *
 * "Active" means not archived, matching what the bed cards call
 * `active_plant_count`: a bed holding only harvested or dead plants is empty,
 * not growing.
 */

import type { Bed, Plant, PlotBedCounts } from '@/types/database.types';
import { getBedLifecycle } from '@/utils/bedStatus';
import { isPlantArchived } from '@/utils/plantHelpers';

export function countBedLifecycles(
  beds: Bed[],
  plantsByBedId: Record<string, Plant[]>
): PlotBedCounts {
  const counts: PlotBedCounts = { growing: 0, resting: 0, empty: 0, permanent: 0, total: 0 };

  for (const bed of beds) {
    const activePlantCount = (plantsByBedId[bed.id] ?? []).filter(
      (plant) => !isPlantArchived(plant)
    ).length;
    counts[getBedLifecycle(bed, activePlantCount)] += 1;
    counts.total += 1;
  }

  return counts;
}

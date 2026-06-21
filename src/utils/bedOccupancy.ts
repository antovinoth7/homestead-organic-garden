import type { Bed } from '@/types/database.types';
import { estimatePlantCapacity } from '@/utils/plantCapacity';

export interface BedOccupancy {
  /** Active (non-archived) plants currently in the bed. */
  count: number;
  /** Estimated max plants the bed can hold (companion-aware), clamped to ≥1. */
  capacity: number;
  /** count / capacity, clamped to 0–1 for the occupancy bar fill. */
  fraction: number;
}

/**
 * How full a bed is, for the listing occupancy bar. Reuses the companion-aware
 * capacity estimate so the denominator matches what the Arrange step allows.
 */
export function getBedOccupancy(
  bed: Pick<Bed, 'type' | 'dimensions'> & { active_plant_count: number }
): BedOccupancy {
  const count = Math.max(0, bed.active_plant_count);
  const { max } = estimatePlantCapacity(bed.type, bed.dimensions.width_m, bed.dimensions.length_m);
  const capacity = Math.max(1, max);
  return { count, capacity, fraction: Math.min(1, count / capacity) };
}

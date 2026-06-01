import type { BedType } from '@/types/database.types';

/**
 * Decides whether a plant in the bed wizard should be persisted as a
 * single row-record (one Firestore doc covering N plants of the same
 * species in the same spatial row) or as N individual specimen records.
 *
 * Row-records make sense for dense leafy / spice / root crops where
 * counting each plant is fake precision and care logs attach at the
 * row. Specimens stay one-doc-per-plant for fruiting, climbers, and
 * three-sisters, where the user tracks each plant individually.
 */
export function classifyAsRowRecord(
  spacingCm: number,
  bedType: BedType,
  isCompanion: boolean
): boolean {
  if (bedType === 'three_sisters') return false;
  if (bedType === 'climber_trellis') return false;
  if (isCompanion) return false;
  if (spacingCm < 30) return true;
  if (spacingCm >= 45) return false;
  return bedType !== 'fruiting';
}

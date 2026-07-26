/**
 * Compact growing-spec formatter for dashboard crop rows.
 *
 * Returns '' for missing data so callers can skip the line entirely — a crop
 * whose care profile carries no harvest range renders its name alone rather
 * than a stub line.
 */

import type { NumericRange } from '@/types/database.types';

/**
 * Harvest duration, e.g. "35 d" for an exact figure or "100–140 d" for a
 * range. The range is shown whole: collapsing it to one number would imply a
 * precision the care profiles do not carry.
 */
export function formatDaysToHarvest(range?: NumericRange): string {
  if (!range) return '';
  const { min, max } = range;
  return min === max ? `${min} d` : `${min}–${max} d`;
}

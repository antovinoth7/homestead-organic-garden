import { BedType, SunlightLevel } from '@/types/database.types';
import { BedWithCoverage } from '@/hooks/useBedData';
import { BedLifecycle, getBedLifecycle } from '@/utils/bedStatus';
import { matchesPlotFilterParent } from '@/utils/plotGrouping';

export type BedSortOption = 'newest' | 'oldest' | 'name' | 'area' | 'plants' | 'legume';

export interface BedActiveFilters {
  type: 'all' | BedType;
  sunlight: SunlightLevel | 'all';
  /** Maps to is_raised_bed: 'raised' = true, 'in_ground' = false. */
  construction: 'all' | 'raised' | 'in_ground';
  /**
   * One `getBedLifecycle` bucket, so the list agrees with every other place a bed
   * states its state — the bed cards, the bed detail, and the Today plot card's bed
   * tile, which links straight into this filter. That precedence
   * (permanent > resting > empty > growing) puts a bed in exactly one bucket: a bed
   * that is both permanent and resting filters as permanent only.
   */
  status: 'all' | BedLifecycle;
  parentLocation: string;
  childLocation: string;
}

export const DEFAULT_BED_FILTERS: BedActiveFilters = {
  type: 'all',
  sunlight: 'all',
  construction: 'all',
  status: 'all',
  parentLocation: '',
  childLocation: '',
};

/** Filters beds by the active filter set and a free-text search query. */
export function filterBeds(
  beds: BedWithCoverage[],
  filters: BedActiveFilters,
  searchQuery: string
): BedWithCoverage[] {
  const q = searchQuery.trim().toLowerCase();
  return beds.filter((b) => {
    if (q) {
      const matches = [b.name, b.type, b.notes, b.parent_location, b.child_location].some(
        (field) => field?.toLowerCase().includes(q)
      );
      if (!matches) return false;
    }
    if (filters.type !== 'all' && b.type !== filters.type) return false;
    if (filters.sunlight !== 'all' && b.sunlight !== filters.sunlight) return false;
    if (filters.construction === 'raised' && !b.is_raised_bed) return false;
    if (filters.construction === 'in_ground' && b.is_raised_bed) return false;
    if (filters.status !== 'all' && getBedLifecycle(b, b.active_plant_count) !== filters.status) {
      return false;
    }
    // Matched on the normalised parent name rather than raw equality: the filter can
    // arrive from the Today plot card, whose plot ids are normalised names and whose
    // unassigned bucket has no parent at all.
    if (
      filters.parentLocation &&
      !matchesPlotFilterParent(b.parent_location, filters.parentLocation)
    ) {
      return false;
    }
    if (filters.childLocation && b.child_location !== filters.childLocation) return false;
    return true;
  });
}

/** Returns a new, sorted array (does not mutate the input). */
export function sortBeds(beds: BedWithCoverage[], sortBy: BedSortOption): BedWithCoverage[] {
  const sorted = [...beds];
  switch (sortBy) {
    case 'newest':
      sorted.sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
      break;
    case 'oldest':
      sorted.sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''));
      break;
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'area':
      sorted.sort((a, b) => b.dimensions.area_sqm - a.dimensions.area_sqm);
      break;
    case 'plants':
      sorted.sort((a, b) => b.plant_count - a.plant_count);
      break;
    case 'legume':
      // Ascending — surfaces low-coverage beds first, matching the warning banner.
      sorted.sort((a, b) => a.legume_coverage_pct - b.legume_coverage_pct);
      break;
  }
  return sorted;
}

// Defined in `bedStatus` (with the other domain thresholds) and re-exported here,
// which is where the bed list, the bed cards and the rotation views import it from.
export { LOW_LEGUME_THRESHOLD } from '@/utils/bedStatus';

/** Single entry point: filter then sort. */
export function filterAndSortBeds(
  beds: BedWithCoverage[],
  filters: BedActiveFilters,
  sortBy: BedSortOption,
  searchQuery: string
): BedWithCoverage[] {
  return sortBeds(filterBeds(beds, filters, searchQuery), sortBy);
}

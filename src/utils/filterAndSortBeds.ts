import { BedType, SunlightLevel } from '@/types/database.types';
import { BedWithCoverage } from '@/hooks/useBedData';

/** Coverage threshold below which a bed is flagged as low-legume (matches the list banner). */
const LOW_LEGUME_THRESHOLD = 20;

export type BedSortOption = 'newest' | 'oldest' | 'name' | 'area' | 'plants' | 'legume';

export interface BedActiveFilters {
  type: 'all' | BedType;
  sunlight: SunlightLevel | 'all';
  /** Maps to is_raised_bed: 'raised' = true, 'in_ground' = false. */
  construction: 'all' | 'raised' | 'in_ground';
  /** 'resting' = is_resting; 'permanent' = is_permanent. */
  status: 'all' | 'resting' | 'permanent';
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
    if (filters.status === 'resting' && !b.is_resting) return false;
    if (filters.status === 'permanent' && !b.is_permanent) return false;
    if (filters.parentLocation && b.parent_location !== filters.parentLocation) return false;
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

export { LOW_LEGUME_THRESHOLD };

/** Single entry point: filter then sort. */
export function filterAndSortBeds(
  beds: BedWithCoverage[],
  filters: BedActiveFilters,
  sortBy: BedSortOption,
  searchQuery: string
): BedWithCoverage[] {
  return sortBeds(filterBeds(beds, filters, searchQuery), sortBy);
}

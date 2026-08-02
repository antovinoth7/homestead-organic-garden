/**
 * The plant list's filter contract — one place that decides what the list
 * shows and what each filter chip's count means.
 *
 * It lives here rather than inside `PlantsScreen` for two reasons. The filter
 * state used to be declared twice — once in the screen, once in
 * `PlantFilterSheet` with a comment asking that they be kept in step — and the
 * copies drifted. And the chip counts were computed from the raw plant array,
 * so a sheet opened over a list of 7 plants still offered "Ground (93)".
 *
 * `countFacets` fixes the second by counting each category against every
 * *other* active filter: a chip answers "how many would I get if I picked
 * this?", which is the only reading that stays true while other filters move.
 * A category never filters its own options, or picking one would zero the rest.
 *
 * Pure — no React, no services — so it is directly unit-testable.
 */

import {
  HealthStatus,
  Plant,
  PlantType,
  SpaceType,
  SunlightLevel,
  WaterRequirement,
} from '@/types/database.types';
import { matchesPlotFilter } from '@/utils/plotGrouping';

export type FilterType = 'all' | PlantType;
export type PestStatusFilter = 'all' | 'active_issues' | 'no_issues';
/** Plants in a bed, or everything else (pots and ground). */
export type BedSegment = 'bed' | 'other';

export interface ActiveFilters {
  type: FilterType;
  health: HealthStatus | 'all';
  space: SpaceType | 'all';
  sunlight: SunlightLevel | 'all';
  water: WaterRequirement | 'all';
  /** Parent location name, or `UNASSIGNED_PLOT_ID`. */
  parentLocation: string;
  childLocation: string;
  pestStatus: PestStatusFilter;
}

export const EMPTY_FILTERS: ActiveFilters = {
  type: 'all',
  health: 'all',
  space: 'all',
  sunlight: 'all',
  water: 'all',
  parentLocation: '',
  childLocation: '',
  pestStatus: 'all',
};

/** Everything the visible list is narrowed by, including the segment control. */
export interface PlantFilterState {
  filters: ActiveFilters;
  searchQuery: string;
  bedSegment: BedSegment;
}

/** A filter that can be held back, so a facet does not count its own options. */
export type FilterCategory = keyof ActiveFilters | 'segment';

export interface PlantFacetCounts {
  type: Record<string, number>;
  health: Record<HealthStatus, number>;
  space: Record<string, number>;
  sunlight: Record<string, number>;
  water: Record<string, number>;
  pestActive: number;
  pestNone: number;
  segment: Record<BedSegment, number>;
}

/**
 * The bucket a plant counts towards. An unset status reads as healthy;
 * `recovering` is its own bucket, not part of healthy — the grower sets it
 * deliberately and both the plot cards and this list report it separately.
 */
export function healthBucketOf(plant: Plant): HealthStatus {
  return plant.health_status || 'healthy';
}

function hasActiveIssue(plant: Plant): boolean {
  return (plant.pest_disease_history || []).some((record) => !record.resolved);
}

function matchesSearch(plant: Plant, query: string): boolean {
  const q = query.toLowerCase();
  return (
    plant.name.toLowerCase().includes(q) ||
    (plant.plant_variety?.toLowerCase().includes(q) ?? false) ||
    (plant.variety?.toLowerCase().includes(q) ?? false) ||
    (plant.location?.toLowerCase().includes(q) ?? false) ||
    (plant.landmarks?.toLowerCase().includes(q) ?? false)
  );
}

/**
 * Applies the search box, every filter and the segment. `except` holds one
 * category back — `countFacets` uses it, nothing else should need to.
 */
export function filterPlants(
  plants: Plant[],
  state: PlantFilterState,
  except?: FilterCategory
): Plant[] {
  const { filters, searchQuery, bedSegment } = state;
  const query = searchQuery.trim();

  return plants.filter((plant) => {
    if (!plant?.name) return false;
    if (query && !matchesSearch(plant, query)) return false;
    if (except !== 'type' && filters.type !== 'all' && plant.plant_type !== filters.type) {
      return false;
    }
    if (except !== 'health' && filters.health !== 'all' && healthBucketOf(plant) !== filters.health) {
      return false;
    }
    if (except !== 'space' && filters.space !== 'all' && plant.space_type !== filters.space) {
      return false;
    }
    if (except !== 'sunlight' && filters.sunlight !== 'all' && plant.sunlight !== filters.sunlight) {
      return false;
    }
    if (except !== 'water' && filters.water !== 'all' && plant.water_requirement !== filters.water) {
      return false;
    }
    // Matched on the exact parent segment, the way the Today plot cards group —
    // a substring test put a plant on the wrong plot whenever its child name
    // contained another plot's name, and disagreed on casing.
    if (
      except !== 'parentLocation' &&
      filters.parentLocation &&
      !matchesPlotFilter(plant, filters.parentLocation)
    ) {
      return false;
    }
    if (
      except !== 'childLocation' &&
      filters.childLocation &&
      !plant.location?.includes(filters.childLocation)
    ) {
      return false;
    }
    if (except !== 'pestStatus' && filters.pestStatus !== 'all') {
      const wanted = filters.pestStatus === 'active_issues';
      if (hasActiveIssue(plant) !== wanted) return false;
    }
    if (except !== 'segment') {
      const inBed = plant.bed_id != null;
      if (inBed !== (bedSegment === 'bed')) return false;
    }
    return true;
  });
}

function tally<T extends string>(
  plants: Plant[],
  valueOf: (plant: Plant) => T | null | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const plant of plants) {
    const value = valueOf(plant);
    if (value) counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

/**
 * How many plants each filter option would yield, given the others. Every
 * category is counted against the list narrowed by everything but itself.
 */
export function countFacets(plants: Plant[], state: PlantFilterState): PlantFacetCounts {
  const byHealth = filterPlants(plants, state, 'health');
  const byPest = filterPlants(plants, state, 'pestStatus');
  const pestActive = byPest.filter(hasActiveIssue).length;
  const bySegment = filterPlants(plants, state, 'segment');

  const health = tally(byHealth, healthBucketOf);
  return {
    type: tally(filterPlants(plants, state, 'type'), (p) => p.plant_type),
    health: {
      healthy: health.healthy ?? 0,
      stressed: health.stressed ?? 0,
      recovering: health.recovering ?? 0,
      sick: health.sick ?? 0,
    },
    space: tally(filterPlants(plants, state, 'space'), (p) => p.space_type),
    sunlight: tally(filterPlants(plants, state, 'sunlight'), (p) => p.sunlight),
    water: tally(filterPlants(plants, state, 'water'), (p) => p.water_requirement),
    pestActive,
    pestNone: byPest.length - pestActive,
    segment: {
      bed: bySegment.filter((p) => p.bed_id != null).length,
      other: bySegment.filter((p) => p.bed_id == null).length,
    },
  };
}

/** How many filters are narrowing the list — drives the toolbar's badge. */
export function countActiveFilters(filters: ActiveFilters): number {
  return (Object.keys(filters) as (keyof ActiveFilters)[]).filter(
    (key) => filters[key] !== EMPTY_FILTERS[key]
  ).length;
}

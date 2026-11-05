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
  CatalogGroup,
  HealthStatus,
  Plant,
  SpaceType,
  SunlightLevel,
  WaterRequirement,
} from '@/types/database.types';
import { getTaxonomy } from '@/config/plants/catalogTaxonomy';
import { matchesPlotFilter } from '@/utils/plotGrouping';

/**
 * The type chip filters by **browse group**, not `plant_type`.
 *
 * The plant card shows a plant's group ("Spices" for Turmeric), so the chip that
 * filters the same list has to speak the same language — filtering by care model
 * would put Turmeric under "Herb" while its own card said "Spices".
 */
export type FilterType = 'all' | CatalogGroup;

/**
 * What the filters read off a plant, worked out once per plant object.
 *
 * `countFacets` runs `filterPlants` about eight times per change, and each pass
 * used to re-run `getTaxonomy`'s name normalisation and lower-case five search
 * fields for every plant. Plants are never mutated in place — every update
 * builds a new object, and `getAllPlants` reuses unchanged ones — so a cache
 * keyed by object identity stays correct and survives a refresh.
 */
interface PlantFacts {
  group: CatalogGroup;
  health: HealthStatus;
  activeIssue: boolean;
  /** name, catalog variety, cultivar, location and landmarks, lower-cased. */
  searchFields: readonly string[];
}

const factsByPlant = new WeakMap<Plant, PlantFacts>();

function factsOf(plant: Plant): PlantFacts {
  let facts = factsByPlant.get(plant);
  if (!facts) {
    const searchable = [
      plant.name,
      plant.plant_variety,
      plant.variety,
      plant.location,
      plant.landmarks,
    ];
    facts = {
      group: getTaxonomy(plant.plant_variety ?? plant.name, plant.plant_type).group,
      health: healthBucketOf(plant),
      activeIssue: (plant.pest_disease_history || []).some((record) => !record.resolved),
      searchFields: searchable
        .filter((value): value is string => typeof value === 'string' && value !== '')
        .map((value) => value.toLowerCase()),
    };
    factsByPlant.set(plant, facts);
  }
  return facts;
}

/** A plant's browse group, resolved from its own name. */
function groupOf(plant: Plant): CatalogGroup {
  return factsOf(plant).group;
}

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
  return factsOf(plant).activeIssue;
}

/** `query` is already trimmed and lower-cased. */
function matchesSearch(plant: Plant, query: string): boolean {
  return factsOf(plant).searchFields.some((field) => field.includes(query));
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
  const query = searchQuery.trim().toLowerCase();

  return plants.filter((plant) => {
    if (!plant?.name) return false;
    if (query && !matchesSearch(plant, query)) return false;
    if (except !== 'type' && filters.type !== 'all' && groupOf(plant) !== filters.type) {
      return false;
    }
    if (except !== 'health' && filters.health !== 'all' && factsOf(plant).health !== filters.health) {
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
/**
 * Pots & Ground vs Beds badge counts, against every other filter. The segment
 * control is always on screen, so this runs on every change — without the
 * other six facet passes, which only the open filter sheet needs.
 */
export function countSegments(
  plants: Plant[],
  state: PlantFilterState
): Record<BedSegment, number> {
  let bed = 0;
  let other = 0;
  for (const plant of filterPlants(plants, state, 'segment')) {
    if (plant.bed_id != null) bed++;
    else other++;
  }
  return { bed, other };
}

export function countFacets(plants: Plant[], state: PlantFilterState): PlantFacetCounts {
  const byHealth = filterPlants(plants, state, 'health');
  const byPest = filterPlants(plants, state, 'pestStatus');
  const pestActive = byPest.filter(hasActiveIssue).length;

  const health = tally(byHealth, (plant) => factsOf(plant).health);
  return {
    type: tally(filterPlants(plants, state, 'type'), groupOf),
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
    segment: countSegments(plants, state),
  };
}

/** How many filters are narrowing the list — drives the toolbar's badge. */
export function countActiveFilters(filters: ActiveFilters): number {
  return (Object.keys(filters) as (keyof ActiveFilters)[]).filter(
    (key) => filters[key] !== EMPTY_FILTERS[key]
  ).length;
}

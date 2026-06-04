import {
  filterBeds,
  sortBeds,
  filterAndSortBeds,
  DEFAULT_BED_FILTERS,
  BedActiveFilters,
} from '@/utils/filterAndSortBeds';
import type { BedWithCoverage } from '@/hooks/useBedData';

function makeBed(overrides?: Partial<BedWithCoverage>): BedWithCoverage {
  return {
    id: 'bed-1',
    user_id: 'user-1',
    name: 'Test Bed',
    type: 'leafy',
    dimensions: { width_m: 1.2, length_m: 3, area_sqm: 3.6 },
    sunlight: 'full_sun',
    soil_type: 'red_laterite',
    slope: 'flat',
    wind: 'sheltered',
    pest_history: [],
    water_source: 'borewell',
    irrigation_method: 'drip',
    is_raised_bed: false,
    is_permanent: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    legume_coverage_pct: 0,
    plant_count: 0,
    active_plant_count: 0,
    ...overrides,
  } as BedWithCoverage;
}

const filters = (overrides?: Partial<BedActiveFilters>): BedActiveFilters => ({
  ...DEFAULT_BED_FILTERS,
  ...overrides,
});

describe('filterBeds', () => {
  it('returns all beds when no filters and empty query', () => {
    const beds = [makeBed({ id: 'a' }), makeBed({ id: 'b' })];
    expect(filterBeds(beds, DEFAULT_BED_FILTERS, '')).toHaveLength(2);
  });

  it('searches name, type, notes, parent_location, child_location (case-insensitive)', () => {
    const beds = [
      makeBed({ id: 'a', name: 'Tomato Patch' }),
      makeBed({ id: 'b', name: 'Greens', notes: 'near the WELL' }),
      makeBed({ id: 'c', name: 'Herbs', parent_location: 'East Field' }),
      makeBed({ id: 'd', name: 'Roots', child_location: 'North-West Corner' }),
      makeBed({ id: 'e', name: 'Spice', type: 'spice' }),
    ];
    expect(filterBeds(beds, DEFAULT_BED_FILTERS, 'tomato').map((b) => b.id)).toEqual(['a']);
    expect(filterBeds(beds, DEFAULT_BED_FILTERS, 'well').map((b) => b.id)).toEqual(['b']);
    expect(filterBeds(beds, DEFAULT_BED_FILTERS, 'east').map((b) => b.id)).toEqual(['c']);
    expect(filterBeds(beds, DEFAULT_BED_FILTERS, 'corner').map((b) => b.id)).toEqual(['d']);
    expect(filterBeds(beds, DEFAULT_BED_FILTERS, 'spice').map((b) => b.id)).toEqual(['e']);
  });

  it('filters by bed type', () => {
    const beds = [makeBed({ id: 'a', type: 'leafy' }), makeBed({ id: 'b', type: 'spice' })];
    expect(filterBeds(beds, filters({ type: 'spice' }), '').map((b) => b.id)).toEqual(['b']);
  });

  it('filters by sunlight', () => {
    const beds = [
      makeBed({ id: 'a', sunlight: 'full_sun' }),
      makeBed({ id: 'b', sunlight: 'shade' }),
    ];
    expect(filterBeds(beds, filters({ sunlight: 'shade' }), '').map((b) => b.id)).toEqual(['b']);
  });

  it('filters by construction (raised vs in_ground)', () => {
    const beds = [
      makeBed({ id: 'a', is_raised_bed: true }),
      makeBed({ id: 'b', is_raised_bed: false }),
    ];
    expect(filterBeds(beds, filters({ construction: 'raised' }), '').map((b) => b.id)).toEqual([
      'a',
    ]);
    expect(filterBeds(beds, filters({ construction: 'in_ground' }), '').map((b) => b.id)).toEqual([
      'b',
    ]);
  });

  it('filters by status (resting / permanent)', () => {
    const beds = [
      makeBed({ id: 'a', is_resting: true }),
      makeBed({ id: 'b', is_permanent: true }),
      makeBed({ id: 'c' }),
    ];
    expect(filterBeds(beds, filters({ status: 'resting' }), '').map((b) => b.id)).toEqual(['a']);
    expect(filterBeds(beds, filters({ status: 'permanent' }), '').map((b) => b.id)).toEqual(['b']);
  });

  it('filters by parent and child location (exact match)', () => {
    const beds = [
      makeBed({ id: 'a', parent_location: 'East', child_location: 'N' }),
      makeBed({ id: 'b', parent_location: 'East', child_location: 'S' }),
      makeBed({ id: 'c', parent_location: 'West', child_location: 'N' }),
    ];
    expect(filterBeds(beds, filters({ parentLocation: 'East' }), '').map((b) => b.id)).toEqual([
      'a',
      'b',
    ]);
    expect(
      filterBeds(beds, filters({ parentLocation: 'East', childLocation: 'S' }), '').map(
        (b) => b.id
      )
    ).toEqual(['b']);
  });

  it('applies multiple filters with AND semantics', () => {
    const beds = [
      makeBed({ id: 'a', type: 'leafy', sunlight: 'full_sun' }),
      makeBed({ id: 'b', type: 'leafy', sunlight: 'shade' }),
      makeBed({ id: 'c', type: 'spice', sunlight: 'full_sun' }),
    ];
    expect(
      filterBeds(beds, filters({ type: 'leafy', sunlight: 'full_sun' }), '').map((b) => b.id)
    ).toEqual(['a']);
  });

  it('returns empty array for empty input', () => {
    expect(filterBeds([], DEFAULT_BED_FILTERS, '')).toEqual([]);
  });
});

describe('sortBeds', () => {
  it('sorts newest and oldest by created_at', () => {
    const beds = [
      makeBed({ id: 'old', created_at: '2026-01-01T00:00:00Z' }),
      makeBed({ id: 'new', created_at: '2026-03-01T00:00:00Z' }),
    ];
    expect(sortBeds(beds, 'newest').map((b) => b.id)).toEqual(['new', 'old']);
    expect(sortBeds(beds, 'oldest').map((b) => b.id)).toEqual(['old', 'new']);
  });

  it('sorts by name alphabetically', () => {
    const beds = [makeBed({ id: 'a', name: 'Zucchini' }), makeBed({ id: 'b', name: 'Amaranth' })];
    expect(sortBeds(beds, 'name').map((b) => b.name)).toEqual(['Amaranth', 'Zucchini']);
  });

  it('sorts by area descending', () => {
    const beds = [
      makeBed({ id: 'small', dimensions: { width_m: 1, length_m: 1, area_sqm: 1 } }),
      makeBed({ id: 'big', dimensions: { width_m: 2, length_m: 5, area_sqm: 10 } }),
    ];
    expect(sortBeds(beds, 'area').map((b) => b.id)).toEqual(['big', 'small']);
  });

  it('sorts by plant_count descending', () => {
    const beds = [makeBed({ id: 'few', plant_count: 2 }), makeBed({ id: 'many', plant_count: 9 })];
    expect(sortBeds(beds, 'plants').map((b) => b.id)).toEqual(['many', 'few']);
  });

  it('sorts by legume coverage ascending (low first)', () => {
    const beds = [
      makeBed({ id: 'high', legume_coverage_pct: 80 }),
      makeBed({ id: 'low', legume_coverage_pct: 5 }),
    ];
    expect(sortBeds(beds, 'legume').map((b) => b.id)).toEqual(['low', 'high']);
  });

  it('does not mutate the input array', () => {
    const beds = [makeBed({ id: 'a', name: 'B' }), makeBed({ id: 'b', name: 'A' })];
    const original = beds.map((b) => b.id);
    sortBeds(beds, 'name');
    expect(beds.map((b) => b.id)).toEqual(original);
  });
});

describe('filterAndSortBeds', () => {
  it('filters then sorts in one pass', () => {
    const beds = [
      makeBed({ id: 'a', type: 'leafy', name: 'Zed', created_at: '2026-01-01T00:00:00Z' }),
      makeBed({ id: 'b', type: 'leafy', name: 'Abe', created_at: '2026-02-01T00:00:00Z' }),
      makeBed({ id: 'c', type: 'spice', name: 'Cy', created_at: '2026-03-01T00:00:00Z' }),
    ];
    const result = filterAndSortBeds(beds, filters({ type: 'leafy' }), 'name', '');
    expect(result.map((b) => b.id)).toEqual(['b', 'a']);
  });
});

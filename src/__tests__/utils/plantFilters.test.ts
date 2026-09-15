import { UNASSIGNED_PLOT_ID } from '../../types/database.types';
import {
  ActiveFilters,
  countActiveFilters,
  countFacets,
  EMPTY_FILTERS,
  filterPlants,
  healthBucketOf,
  PlantFilterState,
} from '../../utils/plantFilters';
import { makePlant } from '../fixtures/plant.fixtures';

function state(
  filters: Partial<ActiveFilters> = {},
  rest: Partial<Omit<PlantFilterState, 'filters'>> = {}
): PlantFilterState {
  return {
    filters: { ...EMPTY_FILTERS, ...filters },
    searchQuery: '',
    bedSegment: 'other',
    ...rest,
  };
}

/**
 * Two plots, both segments, every health status — the population the facet
 * assertions below count against.
 */
const PLANTS = [
  makePlant({
    id: 'h1',
    name: 'Tomato',
    location: 'Home farm - Back',
    space_type: 'ground',
    health_status: 'healthy',
  }),
  makePlant({
    id: 'h2',
    name: 'Brinjal',
    location: 'Home farm',
    space_type: 'pot',
    health_status: null,
  }),
  makePlant({
    id: 'r1',
    name: 'Chilli',
    location: 'Home farm - Back',
    space_type: 'ground',
    health_status: 'recovering',
  }),
  makePlant({
    id: 's1',
    name: 'Okra',
    location: 'Paddy land',
    space_type: 'ground',
    health_status: 'stressed',
  }),
  makePlant({
    id: 'k1',
    name: 'Banana',
    location: 'Paddy land',
    space_type: 'ground',
    health_status: 'sick',
  }),
  makePlant({
    id: 'b1',
    name: 'Spinach',
    location: 'Home farm - Bed 1',
    bed_id: 'bed-1',
    space_type: 'bed',
    health_status: 'healthy',
  }),
];

describe('healthBucketOf', () => {
  it('reads an unset status as healthy and keeps recovering separate', () => {
    expect(healthBucketOf(makePlant({ health_status: null }))).toBe('healthy');
    expect(healthBucketOf(makePlant({ health_status: 'recovering' }))).toBe('recovering');
  });
});

describe('filterPlants', () => {
  it('shows the pots and ground segment by default', () => {
    expect(filterPlants(PLANTS, state()).map((p) => p.id)).toEqual(['h1', 'h2', 'r1', 's1', 'k1']);
  });

  it('shows only bed plants on the bed segment', () => {
    expect(filterPlants(PLANTS, state({}, { bedSegment: 'bed' })).map((p) => p.id)).toEqual(['b1']);
  });

  it('does not count a recovering plant as healthy', () => {
    const healthy = filterPlants(PLANTS, state({ health: 'healthy' }));
    expect(healthy.map((p) => p.id)).toEqual(['h1', 'h2']);
    expect(filterPlants(PLANTS, state({ health: 'recovering' })).map((p) => p.id)).toEqual(['r1']);
  });

  it('scopes to a plot by its exact parent segment', () => {
    expect(filterPlants(PLANTS, state({ parentLocation: 'home FARM' })).map((p) => p.id)).toEqual([
      'h1',
      'h2',
      'r1',
    ]);
  });

  it('combines search with the other filters', () => {
    const found = filterPlants(PLANTS, state({ health: 'sick' }, { searchQuery: 'ban' }));
    expect(found.map((p) => p.id)).toEqual(['k1']);
    expect(filterPlants(PLANTS, state({ health: 'healthy' }, { searchQuery: 'ban' }))).toEqual([]);
  });

  it('holds back the category named in `except`', () => {
    const scoped = state({ health: 'sick', parentLocation: 'Home farm' });
    expect(filterPlants(PLANTS, scoped)).toEqual([]);
    // Without the health filter, the plot still applies.
    expect(filterPlants(PLANTS, scoped, 'health').map((p) => p.id)).toEqual(['h1', 'h2', 'r1']);
  });
});

describe('countFacets', () => {
  it('counts every health bucket when no filter is active', () => {
    expect(countFacets(PLANTS, state()).health).toEqual({
      healthy: 2,
      stressed: 1,
      recovering: 1,
      sick: 1,
    });
  });

  it('does not let a category filter its own options', () => {
    // Healthy is selected, yet the other statuses still report what picking
    // them would give — otherwise every unselected chip would read (0).
    const counts = countFacets(PLANTS, state({ health: 'healthy' }));
    expect(counts.health).toEqual({ healthy: 2, stressed: 1, recovering: 1, sick: 1 });
  });

  it('narrows every other category by the active filters', () => {
    const counts = countFacets(PLANTS, state({ parentLocation: 'Home farm' }));
    // Ground plants on this plot only — 93-in-a-7-plant-list was the bug.
    expect(counts.space.ground).toBe(2);
    expect(counts.health).toEqual({ healthy: 2, stressed: 0, recovering: 1, sick: 0 });
    expect(counts.space.pot).toBe(1);
  });

  it('counts the segments against everything but the segment', () => {
    const counts = countFacets(PLANTS, state({ parentLocation: 'Home farm' }));
    expect(counts.segment).toEqual({ other: 3, bed: 1 });
    // Standing on the bed segment does not change what the segments hold.
    const fromBed = countFacets(PLANTS, state({ parentLocation: 'Home farm' }, { bedSegment: 'bed' }));
    expect(fromBed.segment).toEqual({ other: 3, bed: 1 });
  });

  it('reports zero for a facet the other filters have emptied', () => {
    const counts = countFacets(PLANTS, state({ parentLocation: 'Paddy land' }));
    expect(counts.health.recovering).toBe(0);
    expect(counts.space.pot ?? 0).toBe(0);
  });

  it('splits the pest facet against the other filters', () => {
    const withPest = [
      ...PLANTS,
      makePlant({
        id: 'p1',
        location: 'Home farm',
        space_type: 'ground',
        pest_disease_history: [
          {
            id: 'r1',
            type: 'pest',
            name: 'Aphids',
            resolved: false,
            occurredAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    ];
    const counts = countFacets(withPest, state({ parentLocation: 'Home farm' }));
    expect(counts.pestActive).toBe(1);
    expect(counts.pestNone).toBe(3);
  });

  it('scopes the unassigned bucket to plants with no parent location', () => {
    const plants = [...PLANTS, makePlant({ id: 'u1', location: '', space_type: 'pot' })];
    expect(filterPlants(plants, state({ parentLocation: UNASSIGNED_PLOT_ID })).map((p) => p.id)).toEqual([
      'u1',
    ]);
  });
});

describe('countActiveFilters', () => {
  it('counts only the filters that differ from empty', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...EMPTY_FILTERS, health: 'sick', parentLocation: 'Home farm' })).toBe(
      2
    );
  });
});

describe('type filter — by browse group, not care model', () => {
  /**
   * The behaviour change: chips filter by the group the plant card shows. Turmeric
   * and Ginger are `plant_type: 'herb'` but browse as Spices, so filtering
   * "Herbs & Medicinal" must not return them and "Spices" must.
   */
  const MIXED_HERBS = [
    makePlant({ id: 't1', name: 'Turmeric', plant_variety: 'Turmeric', plant_type: 'herb' }),
    makePlant({ id: 't2', name: 'Ginger', plant_variety: 'Ginger', plant_type: 'herb' }),
    makePlant({ id: 't3', name: 'Tulsi', plant_variety: 'Tulsi', plant_type: 'herb' }),
    makePlant({ id: 't4', name: 'Mint', plant_variety: 'Mint', plant_type: 'herb' }),
  ];

  it('splits one plant_type across two group chips', () => {
    const spices = filterPlants(MIXED_HERBS, state({ type: 'spices' }));
    expect(spices.map((p) => p.name).sort()).toEqual(['Ginger', 'Turmeric']);

    const herbs = filterPlants(MIXED_HERBS, state({ type: 'herbs_medicinal' }));
    expect(herbs.map((p) => p.name).sort()).toEqual(['Mint', 'Tulsi']);
  });

  it('counts facets by group, so the two chips sum to the population', () => {
    const facets = countFacets(MIXED_HERBS, state());
    expect(facets.type.spices).toBe(2);
    expect(facets.type.herbs_medicinal).toBe(2);
    expect(facets.type.herb).toBeUndefined();
  });

  it('files a keerai under greens and a drumstick under vegetables', () => {
    const plants = [
      makePlant({ id: 'k1', name: 'Palak', plant_variety: 'Palak', plant_type: 'spinach' }),
      makePlant({
        id: 'd1',
        name: 'Drumstick',
        plant_variety: 'Drumstick',
        plant_type: 'vegetable',
      }),
    ];
    expect(filterPlants(plants, state({ type: 'greens' })).map((p) => p.name)).toEqual(['Palak']);
    expect(filterPlants(plants, state({ type: 'vegetables' })).map((p) => p.name)).toEqual([
      'Drumstick',
    ]);
  });

  it('falls back to the plant type for a plant the catalog does not know', () => {
    const plants = [
      makePlant({
        id: 'x1',
        name: 'My Own Gourd',
        plant_variety: 'My Own Gourd',
        plant_type: 'vegetable',
      }),
    ];
    expect(filterPlants(plants, state({ type: 'vegetables' })).map((p) => p.name)).toEqual([
      'My Own Gourd',
    ]);
  });
});

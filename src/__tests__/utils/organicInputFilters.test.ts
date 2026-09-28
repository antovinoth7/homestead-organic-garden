import {
  ALL_CATEGORIES,
  EMPTY_ORGANIC_INPUT_FILTERS,
  buildOrganicInputItems,
  countActiveOrganicInputFilters,
  countOrganicInputFacets,
  diyBucketOf,
  filterOrganicInputs,
  matchesOrganicInputQuery,
} from '@/utils/organicInputFilters';
import type { OrganicInputFilters } from '@/utils/organicInputFilters';
import { getAllOrganicInputs, getGroupedOrganicInputs } from '@/config/organicInputs';
import type { OrganicInputEntry } from '@/types/database.types';

function entry(
  over: Partial<OrganicInputEntry> & { id: string; name: string }
): OrganicInputEntry {
  return {
    category: 'fertilizers',
    emoji: '',
    description: '',
    plantsIdeal: [],
    ...over,
  };
}

const JEEVAMRUTHA = entry({
  id: 'jeevamrutha',
  name: 'Jeevamrutha',
  tamilName: 'ஜீவாமிர்தம்',
  category: 'fertilizers',
  description: 'A fermented microbial brew',
  plantsIdeal: ['all crops'],
  recipeId: 'jeevamrutha',
});
const NEEM_CAKE = entry({
  id: 'neem_cake',
  name: 'Neem Cake',
  category: 'soil_amendments',
  description: 'Crushed neem seed residue',
  plantsIdeal: ['brinjal'],
});
const PANCHAGAVYA = entry({
  id: 'panchagavya',
  name: 'Panchagavya',
  category: 'growth_promoters',
  plantsIdeal: ['all crops'],
  recipeId: 'panchagavya',
});
const BONE_MEAL = entry({ id: 'bone_meal', name: '10-Day Bone Meal', category: 'fertilizers' });

const ALL = [JEEVAMRUTHA, NEEM_CAKE, PANCHAGAVYA, BONE_MEAL];

const LABELS: ReadonlyMap<string, string> = new Map([
  ['fertilizers', 'Fertilizers'],
  ['growth_promoters', 'Growth Promoters'],
  ['soil_amendments', 'Soil Amendments'],
]);

const filters = (over: Partial<OrganicInputFilters> = {}): OrganicInputFilters => ({
  ...EMPTY_ORGANIC_INPUT_FILTERS,
  ...over,
});

const ids = (entries: readonly OrganicInputEntry[]): string[] => entries.map((e) => e.id);

describe('matchesOrganicInputQuery', () => {
  it('matches name, Tamil name, description and ideal plants', () => {
    expect(matchesOrganicInputQuery(JEEVAMRUTHA, 'JEEVA')).toBe(true);
    expect(matchesOrganicInputQuery(JEEVAMRUTHA, 'ஜீவாமிர்தம்')).toBe(true);
    expect(matchesOrganicInputQuery(JEEVAMRUTHA, 'microbial')).toBe(true);
    expect(matchesOrganicInputQuery(NEEM_CAKE, 'brinjal')).toBe(true);
    expect(matchesOrganicInputQuery(NEEM_CAKE, 'jeeva')).toBe(false);
  });

  it('treats a blank query as matching everything', () => {
    expect(matchesOrganicInputQuery(BONE_MEAL, '  ')).toBe(true);
  });
});

describe('diyBucketOf', () => {
  it('keys off the recipe id the card already badges', () => {
    expect(diyBucketOf(JEEVAMRUTHA)).toBe('yes');
    expect(diyBucketOf(NEEM_CAKE)).toBe('no');
  });
});

describe('filterOrganicInputs', () => {
  it('narrows by category', () => {
    expect(ids(filterOrganicInputs(ALL, '', filters({ category: 'fertilizers' })))).toEqual([
      'jeevamrutha',
      'bone_meal',
    ]);
  });

  it('splits on whether the input has a recipe', () => {
    expect(ids(filterOrganicInputs(ALL, '', filters({ diy: 'yes' })))).toEqual([
      'jeevamrutha',
      'panchagavya',
    ]);
    expect(ids(filterOrganicInputs(ALL, '', filters({ diy: 'no' })))).toEqual([
      'neem_cake',
      'bone_meal',
    ]);
  });

  it('composes the search box with the facets', () => {
    expect(ids(filterOrganicInputs(ALL, 'all crops', filters({ diy: 'yes' })))).toEqual([
      'jeevamrutha',
      'panchagavya',
    ]);
  });

  it('holds back the named facet, and only that one', () => {
    const state = filters({ category: 'fertilizers', diy: 'yes' });
    expect(ids(filterOrganicInputs(ALL, '', state, 'category'))).toEqual([
      'jeevamrutha',
      'panchagavya',
    ]);
    expect(ids(filterOrganicInputs(ALL, '', state, 'diy'))).toEqual(['jeevamrutha', 'bone_meal']);
  });
});

describe('countOrganicInputFacets', () => {
  it('counts each facet against the other', () => {
    const counts = countOrganicInputFacets(ALL, '', filters({ diy: 'yes' }));
    expect(counts.category).toMatchObject({ fertilizers: 1, growth_promoters: 1 });
    expect(counts.category[ALL_CATEGORIES]).toBe(2);
    // The DIY facet is held back for its own counts, so it sees all four.
    expect(counts.diy).toMatchObject({ yes: 2, no: 2, all: 4 });
    expect(counts.total).toBe(2);
  });
});

describe('countActiveOrganicInputFilters', () => {
  it('is zero at defaults and three with both facets and a grouping off default', () => {
    expect(countActiveOrganicInputFilters(EMPTY_ORGANIC_INPUT_FILTERS, 'category')).toBe(0);
    expect(
      countActiveOrganicInputFilters(filters({ category: 'fertilizers', diy: 'yes' }), 'alpha')
    ).toBe(3);
  });
});

describe('buildOrganicInputItems', () => {
  it('sections by category in registry order, rows A-Z inside', () => {
    const items = buildOrganicInputItems(ALL, 'category', LABELS);
    expect(
      items.map((i) => (i.kind === 'section' ? `# ${i.title} (${i.count})` : i.entry.name))
    ).toEqual([
      '# Fertilizers (2)',
      '10-Day Bone Meal',
      'Jeevamrutha',
      '# Growth Promoters (1)',
      'Panchagavya',
      '# Soil Amendments (1)',
      'Neem Cake',
    ]);
  });

  it('sections A-Z with a # bucket for a name starting with a digit', () => {
    const titles = buildOrganicInputItems(ALL, 'alpha', LABELS)
      .filter((i) => i.kind === 'section')
      .map((i) => (i.kind === 'section' ? i.title : ''));
    expect(titles).toEqual(['#', 'J', 'N', 'P']);
  });
});

describe('against the real registry', () => {
  const entries = getAllOrganicInputs();
  const labels = new Map(getGroupedOrganicInputs().map((g) => [g.category, g.label]));

  it('splits the corpus into homemade and bought, with both sides populated', () => {
    const diy = filterOrganicInputs(entries, '', filters({ diy: 'yes' }));
    const bought = filterOrganicInputs(entries, '', filters({ diy: 'no' }));
    expect(diy.length).toBeGreaterThan(0);
    expect(bought.length).toBeGreaterThan(0);
    expect(diy.length + bought.length).toBe(entries.length);
    expect(diy.every((e) => e.recipeId)).toBe(true);
  });

  it('sections every entry, losing none to an unlabelled category', () => {
    const items = buildOrganicInputItems(entries, 'category', labels);
    expect(items.filter((i) => i.kind === 'entry')).toHaveLength(entries.length);
    expect(items.some((i) => i.kind === 'section' && i.title === 'Other')).toBe(false);
  });
});

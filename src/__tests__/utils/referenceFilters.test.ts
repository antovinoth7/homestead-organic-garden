import {
  ALL_CATEGORIES,
  EMPTY_REFERENCE_FILTERS,
  buildReferenceItems,
  countActiveReferenceFilters,
  countReferenceFacets,
  easiestEffort,
  filterReferenceEntries,
  matchesReferenceQuery,
} from '@/utils/referenceFilters';
import type { ReferenceFilters } from '@/utils/referenceFilters';
import type { ReferenceEntry } from '@/components/reference/types';
import type { OrganicControlItem, RiskLevel } from '@/types/database.types';
import { DEFAULT_ZONE } from '@/config/zones';

/**
 * A fixed date inside a known zone season, so a run on a season boundary can
 * never flip what `getCurrentRisk` reports underneath these assertions.
 */
const JULY = new Date(2025, 6, 15);
const CURRENT_SEASON = DEFAULT_ZONE.seasons.find(
  (s) => s.startMonth <= 7 && s.endMonth >= 7
)!.id;
const OTHER_SEASON = DEFAULT_ZONE.seasons.find((s) => s.id !== CURRENT_SEASON)!.id;

function treatment(effort: OrganicControlItem['effort']): OrganicControlItem {
  return { name: `${effort} spray`, method: 'spray', effort };
}

function entry(over: Partial<ReferenceEntry> & { id: string; name: string }): ReferenceEntry {
  return {
    tamilName: undefined,
    category: 'sap_sucking',
    emoji: '',
    identification: '',
    damageDescription: '',
    organicPrevention: [],
    organicTreatments: [treatment('easy')],
    plantsAffected: [],
    ...over,
  };
}

function risky(level: RiskLevel): Partial<ReferenceEntry> {
  return { seasonalRisk: { [CURRENT_SEASON]: level } };
}

const APHID = entry({
  id: 'aphid',
  name: 'Aphids',
  tamilName: 'அசுவினி',
  category: 'sap_sucking',
  plantsAffected: ['Brinjal', 'Vegetables'],
  organicTreatments: [treatment('advanced'), treatment('easy')],
  ...risky('high'),
});
const MITE = entry({
  id: 'mite',
  name: 'Red Spider Mite',
  category: 'mites',
  plantsAffected: ['Mango'],
  organicTreatments: [treatment('moderate'), treatment('advanced')],
  ...risky('moderate'),
});
const BORER = entry({
  id: 'borer',
  name: 'Stem Borer',
  category: 'borers_larvae',
  plantsAffected: ['Coconut'],
  organicTreatments: [treatment('advanced')],
  ...risky('low'),
});
/** Records risk only for a season we are not in — the undefined-risk case. */
const DORMANT = entry({
  id: 'dormant',
  name: '4-Spotted Beetle',
  category: 'mites',
  organicTreatments: [treatment('easy')],
  seasonalRisk: { [OTHER_SEASON]: 'high' },
});

const ALL = [APHID, MITE, BORER, DORMANT];

const LABELS: ReadonlyMap<string, string> = new Map([
  ['sap_sucking', 'Sap-Sucking'],
  ['mites', 'Mites & Spiders'],
  ['borers_larvae', 'Borers & Larvae'],
]);

const filters = (over: Partial<ReferenceFilters> = {}): ReferenceFilters => ({
  ...EMPTY_REFERENCE_FILTERS,
  ...over,
});

const ids = (entries: readonly ReferenceEntry[]): string[] => entries.map((e) => e.id);

describe('matchesReferenceQuery', () => {
  it('matches name, Tamil name and affected plants, case-insensitively', () => {
    expect(matchesReferenceQuery(APHID, 'APH')).toBe(true);
    expect(matchesReferenceQuery(APHID, 'அசுவினி')).toBe(true);
    expect(matchesReferenceQuery(APHID, 'brinjal')).toBe(true);
  });

  it('leaves the long prose fields out, so a short query cannot match everything', () => {
    const wordy = entry({
      id: 'wordy',
      name: 'Thrips',
      identification: 'Look for silvery streaks',
      damageDescription: 'Silvery scarring on leaves',
    });
    expect(matchesReferenceQuery(wordy, 'silvery')).toBe(false);
  });

  it('treats an empty or blank query as matching everything', () => {
    expect(matchesReferenceQuery(APHID, '')).toBe(true);
    expect(matchesReferenceQuery(APHID, '   ')).toBe(true);
  });
});

describe('easiestEffort', () => {
  it('reduces several treatments to the gentlest one', () => {
    expect(easiestEffort(APHID)).toBe('easy');
    expect(easiestEffort(MITE)).toBe('moderate');
    expect(easiestEffort(BORER)).toBe('advanced');
  });

  it('is undefined when the entry offers no treatment at all', () => {
    expect(easiestEffort(entry({ id: 'x', name: 'X', organicTreatments: [] }))).toBeUndefined();
  });
});

describe('filterReferenceEntries', () => {
  it('narrows by category', () => {
    expect(ids(filterReferenceEntries(ALL, '', filters({ category: 'mites' }), undefined, JULY)))
      .toEqual(['mite', 'dormant']);
  });

  it('narrows by risk in the current season', () => {
    expect(ids(filterReferenceEntries(ALL, '', filters({ risk: 'high' }), undefined, JULY)))
      .toEqual(['aphid']);
  });

  it('drops entries with no risk this season from every specific risk bucket', () => {
    for (const risk of ['high', 'moderate', 'low'] as const) {
      const kept = filterReferenceEntries(ALL, '', filters({ risk }), undefined, JULY);
      expect(ids(kept)).not.toContain('dormant');
    }
    expect(ids(filterReferenceEntries(ALL, '', filters(), undefined, JULY))).toContain('dormant');
  });

  it('files a multi-effort entry under its easiest option only', () => {
    expect(ids(filterReferenceEntries(ALL, '', filters({ effort: 'easy' }), undefined, JULY)))
      .toEqual(['aphid', 'dormant']);
    // Aphids carry an advanced treatment too, but are not an advanced problem.
    expect(ids(filterReferenceEntries(ALL, '', filters({ effort: 'advanced' }), undefined, JULY)))
      .toEqual(['borer']);
  });

  it('composes the search box with every facet', () => {
    const kept = filterReferenceEntries(ALL, 'mango', filters({ risk: 'moderate' }), undefined, JULY);
    expect(ids(kept)).toEqual(['mite']);
  });

  it('holds back the named facet, and only that one', () => {
    const state = filters({ category: 'mites', risk: 'high' });
    // Without the category constraint, the high-risk aphid returns.
    expect(ids(filterReferenceEntries(ALL, '', state, 'category', JULY))).toEqual(['aphid']);
    // Without the risk constraint, both mites return.
    expect(ids(filterReferenceEntries(ALL, '', state, 'risk', JULY))).toEqual(['mite', 'dormant']);
  });
});

describe('countReferenceFacets', () => {
  it('counts each facet against the others, so a chip says what picking it gives', () => {
    // Category is held back for its own counts, so the mites count still sees
    // the high-risk constraint and reports only what choosing it would yield.
    const counts = countReferenceFacets(ALL, '', filters({ risk: 'high' }), JULY);
    expect(counts.category.sap_sucking).toBe(1);
    expect(counts.category.mites).toBeUndefined();
    expect(counts.category[ALL_CATEGORIES]).toBe(1);
  });

  it('gives each facet its own all-option the count of dropping just that facet', () => {
    const counts = countReferenceFacets(ALL, '', filters({ category: 'mites' }), JULY);
    // Risk is unconstrained, so its `all` still sees the category filter.
    expect(counts.risk.all).toBe(2);
    // Category's own `all` drops the category filter and sees everything.
    expect(counts.category[ALL_CATEGORIES]).toBe(4);
  });

  it('reports a total that honours every facet at once', () => {
    expect(countReferenceFacets(ALL, '', filters({ category: 'mites', risk: 'moderate' }), JULY).total)
      .toBe(1);
  });

  it('counts risk and effort buckets', () => {
    const counts = countReferenceFacets(ALL, '', filters(), JULY);
    expect(counts.risk).toMatchObject({ high: 1, moderate: 1, low: 1, all: 4 });
    expect(counts.effort).toMatchObject({ easy: 2, moderate: 1, advanced: 1, all: 4 });
  });
});

describe('countActiveReferenceFilters', () => {
  it('is zero at defaults', () => {
    expect(countActiveReferenceFilters(EMPTY_REFERENCE_FILTERS, 'category')).toBe(0);
  });

  it('counts the grouping alongside the three facets, reaching four', () => {
    expect(
      countActiveReferenceFilters(
        filters({ category: 'mites', risk: 'high', effort: 'easy' }),
        'alpha'
      )
    ).toBe(4);
  });
});

describe('buildReferenceItems', () => {
  it('sections by category in registry order, not alphabetically', () => {
    const titles = buildReferenceItems(ALL, 'category', LABELS, JULY)
      .filter((i) => i.kind === 'section')
      .map((i) => (i.kind === 'section' ? i.title : ''));
    expect(titles).toEqual(['Sap-Sucking', 'Mites & Spiders', 'Borers & Larvae']);
  });

  it('keeps an entry whose category the label map has never heard of', () => {
    const stray = entry({ id: 'stray', name: 'Unknown', category: 'not_a_category' });
    const items = buildReferenceItems([stray], 'category', LABELS, JULY);
    expect(items).toEqual([
      { kind: 'section', title: 'Other', count: 1 },
      { kind: 'entry', entry: stray },
    ]);
  });

  it('sections by risk worst-first, with a trailing bucket for no risk', () => {
    const titles = buildReferenceItems(ALL, 'risk', LABELS, JULY)
      .filter((i) => i.kind === 'section')
      .map((i) => (i.kind === 'section' ? i.title : ''));
    expect(titles).toEqual([
      'High risk now',
      'Moderate risk now',
      'Low risk now',
      'No risk this season',
    ]);
  });

  it('sections A-Z with a # bucket for names that do not start with a letter', () => {
    const items = buildReferenceItems(ALL, 'alpha', LABELS, JULY);
    const titles = items
      .filter((i) => i.kind === 'section')
      .map((i) => (i.kind === 'section' ? i.title : ''));
    expect(titles).toEqual(['#', 'A', 'R', 'S']);
  });

  it('sorts rows A-Z inside a section and stamps the section count', () => {
    const items = buildReferenceItems([MITE, DORMANT], 'category', LABELS, JULY);
    expect(items[0]).toEqual({ kind: 'section', title: 'Mites & Spiders', count: 2 });
    expect(items.slice(1).map((i) => (i.kind === 'entry' ? i.entry.name : ''))).toEqual([
      '4-Spotted Beetle',
      'Red Spider Mite',
    ]);
  });

  it('emits no section for a group the filters have emptied', () => {
    const items = buildReferenceItems([BORER], 'category', LABELS, JULY);
    expect(items.filter((i) => i.kind === 'section')).toHaveLength(1);
  });
});

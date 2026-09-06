import {
  buildBrowseItems,
  buildSearchItems,
  measureCatalogItems,
} from '@/utils/catalogListItems';
import type { CatalogListItem } from '@/utils/catalogListItems';
import {
  CATALOG_ROW_TOTAL_HEIGHT,
  CATALOG_SECTION_HEADER_HEIGHT,
} from '@/styles/catalogMetrics';
import type { PlantProfile } from '@/types/database.types';

const profile = (overrides: Partial<PlantProfile> = {}): PlantProfile => ({
  plantType: 'vegetable',
  name: 'Test Plant',
  ...overrides,
});

const build = (
  plantNames: string[],
  counts: Record<string, number> = {},
  profilesForType: Record<string, PlantProfile> = {}
): CatalogListItem[] => buildBrowseItems({ plantNames, counts, profilesForType });

type SectionItem = Extract<CatalogListItem, { kind: 'section' }>;
type BrowseItem = Extract<CatalogListItem, { kind: 'browse' }>;

const sections = (items: CatalogListItem[]): SectionItem[] =>
  items.filter((i): i is SectionItem => i.kind === 'section');

const rows = (items: CatalogListItem[]): BrowseItem[] =>
  items.filter((i): i is BrowseItem => i.kind === 'browse');

describe('buildBrowseItems', () => {
  it('puts a header before each letter run and counts it', () => {
    const items = build(['Ash Gourd', 'Avarai', 'Brinjal', 'Tomato']);

    expect(sections(items).map((s) => [s.letter, s.count])).toEqual([
      ['A', 2],
      ['B', 1],
      ['T', 1],
    ]);
    expect(items[0]).toMatchObject({ kind: 'section', letter: 'A' });
    expect(items[1]).toMatchObject({ kind: 'browse', name: 'Ash Gourd' });
  });

  // Each letter group is its own rounded card, so the flags are per group.
  it('marks first and last within each group, not across the list', () => {
    const items = build(['Ash Gourd', 'Avarai', 'Brinjal']);
    const flags = rows(items).map((r) => [r.name, r.isFirst, r.isLast]);

    expect(flags).toEqual([
      ['Ash Gourd', true, false],
      ['Avarai', false, true],
      ['Brinjal', true, true],
    ]);
  });

  it('gives a single-plant group both flags', () => {
    expect(rows(build(['Tomato']))[0]).toMatchObject({ isFirst: true, isLast: true });
  });

  it('buckets non-letter names under # as their own group', () => {
    const items = build(['123 Gourd', 'Ash Gourd']);
    expect(sections(items).map((s) => s.letter)).toEqual(['#', 'A']);
  });

  it('carries garden counts and subtitles through', () => {
    const items = build(
      ['Brinjal', 'Tomato'],
      { Brinjal: 3 },
      {
        Brinjal: profile({ name: 'Brinjal', description: 'Warm-season fruiting plant' }),
        Tomato: profile({ name: 'Tomato', varieties: ['Cherry', 'Hybrid'] }),
      }
    );

    expect(rows(items)[0]).toMatchObject({
      name: 'Brinjal',
      count: 3,
      subtitle: 'Warm-season fruiting plant',
    });
    // No description, so it falls back to the variety count.
    expect(rows(items)[1]).toMatchObject({ name: 'Tomato', count: 0, subtitle: '2 varieties' });
  });

  it('leaves the subtitle unset when a plant has neither', () => {
    expect(rows(build(['Tomato']))[0]?.subtitle).toBeUndefined();
  });

  it('returns nothing for an empty category', () => {
    expect(build([])).toEqual([]);
  });
});

describe('measureCatalogItems', () => {
  it('accumulates offsets across the two item heights', () => {
    const { heights, offsets } = measureCatalogItems(build(['Ash Gourd', 'Avarai', 'Brinjal']));

    expect(heights).toEqual([
      CATALOG_SECTION_HEADER_HEIGHT,
      CATALOG_ROW_TOTAL_HEIGHT,
      CATALOG_ROW_TOTAL_HEIGHT,
      CATALOG_SECTION_HEADER_HEIGHT,
      CATALOG_ROW_TOTAL_HEIGHT,
    ]);

    // Every offset is the sum of the heights before it — this is what keeps
    // scrolling gap-free, so assert the invariant rather than fixed numbers.
    let running = 0;
    heights.forEach((height, i) => {
      expect(offsets[i]).toBe(running);
      running += height;
    });
  });

  it('handles an empty list', () => {
    expect(measureCatalogItems([])).toEqual({ items: [], heights: [], offsets: [] });
  });
});

describe('buildSearchItems', () => {
  it('wraps results without adding letter groups', () => {
    const result = {
      name: 'Brinjal',
      plantType: 'vegetable',
      gardenCount: 0,
      matchedField: 'name',
    } as unknown as Parameters<typeof buildSearchItems>[0][number];

    const items = buildSearchItems([result]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'result' });
    expect(sections(items)).toEqual([]);
  });
});

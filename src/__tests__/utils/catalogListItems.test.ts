import {
  buildBrowseItems,
  buildSearchItems,
  measureCatalogItems,
} from '@/utils/catalogListItems';
import type { CatalogBrowseEntry, CatalogGroupMode } from '@/utils/catalogListItems';
import { catalogRowTotalHeight, catalogSectionHeaderHeight } from '@/styles/catalogMetrics';
import type { CatalogSearchResult } from '@/utils/catalogSearch';

const entry = (
  name: string,
  over: Partial<CatalogBrowseEntry> = {}
): CatalogBrowseEntry => ({
  name,
  plantType: 'vegetable',
  habit: 'annual_bed',
  lifecycle: 'annual',
  count: 0,
  ...over,
});

const titles = (items: ReturnType<typeof buildBrowseItems>): string[] =>
  items.filter((i) => i.kind === 'section').map((i) => (i.kind === 'section' ? i.title : ''));

const namesIn = (items: ReturnType<typeof buildBrowseItems>): string[] =>
  items.filter((i) => i.kind === 'browse').map((i) => (i.kind === 'browse' ? i.name : ''));

const VEG: CatalogBrowseEntry[] = [
  entry('Tomato', { subGroup: 'fruit_vegetables' }),
  entry('Brinjal', { subGroup: 'fruit_vegetables' }),
  entry('Bitter Gourd', { subGroup: 'gourds_melons', habit: 'vine' }),
  entry('Tapioca', { subGroup: 'roots_tubers', habit: 'shrub', lifecycle: 'perennial' }),
  entry('Onion', { subGroup: 'onion_family', lifecycle: 'biennial' }),
];

describe('buildBrowseItems — type mode', () => {
  it('sections by sub-group in the declared order, not the data order', () => {
    // gourds_melons precedes fruit_vegetables in SUB_GROUP_ORDER even though
    // fruit_vegetables came first in the input.
    expect(titles(buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'type' }))).toEqual([
      'Gourds & Melons',
      'Fruit Vegetables',
      'Roots & Tubers',
      'Onion Family',
    ]);
  });

  it('omits sub-groups with no members', () => {
    const items = buildBrowseItems({
      group: 'vegetables',
      entries: [entry('Cabbage', { subGroup: 'cabbage_family' })],
      mode: 'type',
    });
    expect(titles(items)).toEqual(['Cabbage Family']);
  });

  it('sorts A–Z within a section', () => {
    const items = buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'type' });
    expect(namesIn(items)).toEqual(['Bitter Gourd', 'Brinjal', 'Tomato', 'Tapioca', 'Onion']);
  });

  it('collects a user-added plant with no sub-group under Other', () => {
    const items = buildBrowseItems({
      group: 'vegetables',
      entries: [entry('Tomato', { subGroup: 'fruit_vegetables' }), entry('My Own Gourd')],
      mode: 'type',
    });
    expect(titles(items)).toEqual(['Fruit Vegetables', 'Other']);
    expect(namesIn(items)).toEqual(['Tomato', 'My Own Gourd']);
  });

  it('renders a group with no declared sub-groups as one run', () => {
    const items = buildBrowseItems({
      group: 'farm_support',
      entries: [entry('Agathi', { habit: 'tree' }), entry('Nochi', { habit: 'shrub' })],
      mode: 'type',
    });
    expect(titles(items)).toHaveLength(1);
    expect(namesIn(items)).toEqual(['Agathi', 'Nochi']);
  });
});

describe('buildBrowseItems — season mode', () => {
  it('sections annual → biennial → perennial → permanent, skipping empties', () => {
    const entries = [
      ...VEG,
      entry('Mango', { plantType: 'fruit_tree', habit: 'tree', lifecycle: 'permanent' }),
    ];
    expect(titles(buildBrowseItems({ group: 'vegetables', entries, mode: 'season' }))).toEqual([
      'Annual — sow each season',
      'Biennial — two seasons',
      'Perennial — stays in the bed',
      'Permanent — never cleared',
    ]);
  });

  it('puts each plant under its own lifecycle regardless of sub-group', () => {
    const items = buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'season' });
    const sections = items.reduce<Record<string, string[]>>((acc, item) => {
      if (item.kind === 'section') acc[item.title] = [];
      else if (item.kind === 'browse') {
        const last = Object.keys(acc).pop();
        if (last) acc[last]!.push(item.name);
      }
      return acc;
    }, {});
    expect(sections['Annual — sow each season']).toEqual(['Bitter Gourd', 'Brinjal', 'Tomato']);
    expect(sections['Biennial — two seasons']).toEqual(['Onion']);
    expect(sections['Perennial — stays in the bed']).toEqual(['Tapioca']);
  });
});

describe('buildBrowseItems — alpha mode', () => {
  it('sections by first letter', () => {
    const items = buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'alpha' });
    expect(titles(items)).toEqual(['B', 'O', 'T']);
    expect(namesIn(items)).toEqual(['Bitter Gourd', 'Brinjal', 'Onion', 'Tapioca', 'Tomato']);
  });

  it('buckets a name that does not start with a letter under #', () => {
    const items = buildBrowseItems({
      group: 'vegetables',
      entries: [entry('123 Gourd'), entry('Tomato')],
      mode: 'alpha',
    });
    expect(titles(items)).toEqual(['#', 'T']);
  });
});

describe('section boundaries', () => {
  it.each<CatalogGroupMode>(['type', 'season', 'alpha'])(
    'marks isFirst/isLast per section, not per list, in %s mode',
    (mode) => {
      const items = buildBrowseItems({ group: 'vegetables', entries: VEG, mode });
      let seenSection = 0;
      for (const item of items) {
        if (item.kind === 'section') seenSection += 1;
      }
      expect(seenSection).toBeGreaterThan(1);

      // Every section's first row is isFirst and its last row is isLast.
      let current: typeof items = [];
      const sections: (typeof items)[] = [];
      for (const item of items) {
        if (item.kind === 'section') {
          if (current.length) sections.push(current);
          current = [];
        } else current.push(item);
      }
      if (current.length) sections.push(current);

      for (const rows of sections) {
        expect(rows[0]!.kind === 'browse' && rows[0]!.isFirst).toBe(true);
        expect(rows.at(-1)!.kind === 'browse' && (rows.at(-1) as { isLast: boolean }).isLast).toBe(
          true
        );
      }
    }
  );

  it('carries each row its own plantType rather than the active tab', () => {
    const items = buildBrowseItems({
      group: 'fruits',
      entries: [
        entry('Banana', { plantType: 'fruit_tree', habit: 'clump', lifecycle: 'perennial' }),
        entry('Pineapple', { plantType: 'fruit_tree', habit: 'perennial', lifecycle: 'perennial' }),
      ],
      mode: 'type',
    });
    const rows = items.filter((i) => i.kind === 'browse');
    expect(rows.every((r) => r.kind === 'browse' && r.plantType === 'fruit_tree')).toBe(true);
    expect(rows.map((r) => (r.kind === 'browse' ? r.habit : null))).toEqual(['clump', 'perennial']);
  });
});

describe('measureCatalogItems', () => {
  it.each<CatalogGroupMode>(['type', 'season', 'alpha'])(
    'keeps offsets cumulative in %s mode',
    (mode) => {
      const { items, heights, offsets } = measureCatalogItems(
        buildBrowseItems({ group: 'vegetables', entries: VEG, mode })
      );
      expect(heights).toHaveLength(items.length);
      expect(offsets).toHaveLength(items.length);
      let running = 0;
      items.forEach((item, index) => {
        expect(offsets[index]).toBe(running);
        expect(heights[index]).toBe(
          item.kind === 'section' ? catalogSectionHeaderHeight() : catalogRowTotalHeight()
        );
        running += heights[index]!;
      });
    }
  );

  // The whole point of scaling the metrics: if the offsets table and the
  // heights disagree at a non-default font size, getItemLayout starts lying and
  // fast scrolling leaves gaps. This is the regression guard for that.
  it.each([1, 1.3, 1.6, 3])('keeps offsets cumulative at font scale %s', (scale) => {
    const { items, heights, offsets } = measureCatalogItems(
      buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'type' }),
      scale
    );

    let running = 0;
    items.forEach((item, index) => {
      expect(offsets[index]).toBe(running);
      expect(heights[index]).toBe(
        item.kind === 'section'
          ? catalogSectionHeaderHeight(scale)
          : catalogRowTotalHeight(scale)
      );
      running += heights[index]!;
    });
  });

  it('grows rows with the font scale, up to the clamp', () => {
    const at1 = measureCatalogItems(
      buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'type' }),
      1
    );
    const at13 = measureCatalogItems(
      buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'type' }),
      1.3
    );
    const at3 = measureCatalogItems(
      buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'type' }),
      3
    );

    const last = (o: number[]): number => o[o.length - 1]!;
    expect(last(at13.offsets)).toBeGreaterThan(last(at1.offsets));

    // Past the clamp the list stops growing: 3x is measured exactly as 1.6x.
    const atClamp = measureCatalogItems(
      buildBrowseItems({ group: 'vegetables', entries: VEG, mode: 'type' }),
      1.6
    );
    expect(at3.heights).toEqual(atClamp.heights);
    expect(at3.offsets).toEqual(atClamp.offsets);
  });

  it('measures search results as rows', () => {
    const result = { name: 'Tomato', plantType: 'vegetable' } as CatalogSearchResult;
    const { heights } = measureCatalogItems(buildSearchItems([result]));
    expect(heights).toEqual([catalogRowTotalHeight()]);
  });
});

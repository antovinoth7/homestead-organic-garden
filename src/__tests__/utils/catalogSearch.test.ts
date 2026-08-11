import {
  buildCatalogSearchIndex,
  pushRecentSearch,
  searchCatalog,
  splitAtSpan,
} from '@/utils/catalogSearch';
import type { CatalogSearchEntry } from '@/utils/catalogSearch';
import {
  makeCountsByType,
  makePlantProfile,
  makePlantProfiles,
} from '../fixtures/plant.fixtures';

const brinjal = makePlantProfile({
  plantType: 'vegetable',
  name: 'Brinjal',
  tamilName: 'கத்தரிக்காய்',
});
const longBrinjal = makePlantProfile({
  plantType: 'vegetable',
  name: 'Long Brinjal',
  tamilName: 'நீள கத்தரிக்காய்',
});
const tomato = makePlantProfile({ plantType: 'vegetable', name: 'Tomato' });
const basil = makePlantProfile({ plantType: 'herb', name: 'Basil' });
const mango = makePlantProfile({ plantType: 'fruit_tree', name: 'Mango' });

const profiles = makePlantProfiles([brinjal, longBrinjal, tomato, basil, mango]);
const counts = makeCountsByType({
  vegetable: { Brinjal: 2, Tomato: 5 },
  fruit_tree: { Mango: 1 },
});

const index = buildCatalogSearchIndex(profiles, counts);

describe('buildCatalogSearchIndex', () => {
  it('flattens every category into one list', () => {
    expect(index).toHaveLength(5);
    expect(index.map((entry) => entry.name).sort()).toEqual([
      'Basil',
      'Brinjal',
      'Long Brinjal',
      'Mango',
      'Tomato',
    ]);
  });

  it('carries plantType, tamilName and garden counts', () => {
    const entry = index.find((item) => item.name === 'Brinjal');
    expect(entry).toMatchObject({
      plantType: 'vegetable',
      tamilName: 'கத்தரிக்காய்',
      gardenCount: 2,
    });
  });

  it('defaults garden count to zero when the plant is not in the garden', () => {
    expect(index.find((item) => item.name === 'Basil')?.gardenCount).toBe(0);
  });
});

describe('searchCatalog', () => {
  it('returns nothing for an empty or whitespace query', () => {
    expect(searchCatalog(index, '')).toEqual([]);
    expect(searchCatalog(index, '   ')).toEqual([]);
  });

  it('matches across categories, not just one', () => {
    const results = searchCatalog(index, 'a');
    const types = new Set(results.map((result) => result.plantType));
    expect(types.has('vegetable')).toBe(true);
    expect(types.has('herb')).toBe(true);
    expect(types.has('fruit_tree')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(searchCatalog(index, 'BRINJAL').map((r) => r.name)).toEqual([
      'Brinjal',
      'Long Brinjal',
    ]);
  });

  it('ranks prefix matches above substring matches', () => {
    const results = searchCatalog(index, 'brin');
    expect(results.map((result) => result.name)).toEqual(['Brinjal', 'Long Brinjal']);
  });

  it('matches on the Tamil name and reports which field hit', () => {
    const results = searchCatalog(index, 'கத்தரிக்காய்');
    expect(results.map((result) => result.name).sort()).toEqual(['Brinjal', 'Long Brinjal']);
    expect(results.every((result) => result.matchedField === 'tamilName')).toBe(true);
    expect(results.every((result) => result.tamilSpan !== undefined)).toBe(true);
  });

  it('prefers the English name span when both fields match', () => {
    const bilingual: CatalogSearchEntry[] = [
      { plantType: 'vegetable', name: 'Keerai', tamilName: 'Keerai', gardenCount: 0 },
    ];
    const results = searchCatalog(bilingual, 'keerai');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      matchedField: 'name',
      nameSpan: { start: 0, end: 6 },
    });
    expect(results[0]?.tamilSpan).toBeUndefined();
  });

  it('returns spans that slice the ORIGINAL string back to the query', () => {
    for (const query of ['brin', 'Brinjal', 'ango', 'கத்தரிக்காய்']) {
      for (const result of searchCatalog(index, query)) {
        const span = result.nameSpan ?? result.tamilSpan;
        const source = result.nameSpan ? result.name : (result.tamilName ?? '');
        expect(span).toBeDefined();
        expect(source.slice(span!.start, span!.end).toLocaleLowerCase()).toBe(
          query.toLocaleLowerCase()
        );
      }
    }
  });

  it('returns an empty list when nothing matches', () => {
    expect(searchCatalog(index, 'zzzz')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(searchCatalog(index, 'a', 2)).toHaveLength(2);
  });
});

describe('splitAtSpan', () => {
  it('splits into before, match and after', () => {
    expect(splitAtSpan('Long Brinjal', { start: 5, end: 9 })).toEqual(['Long ', 'Brin', 'jal']);
  });

  it('returns the whole string as the leading part when there is no span', () => {
    expect(splitAtSpan('Tomato')).toEqual(['Tomato', '', '']);
  });
});

describe('pushRecentSearch', () => {
  it('adds the newest query first', () => {
    expect(pushRecentSearch(['okra'], 'tomato')).toEqual(['tomato', 'okra']);
  });

  it('dedupes case-insensitively and moves the entry to the front', () => {
    expect(pushRecentSearch(['okra', 'Tomato'], 'tomato')).toEqual(['tomato', 'okra']);
  });

  it('trims and drops empty queries', () => {
    expect(pushRecentSearch(['okra'], '  ')).toEqual(['okra']);
    expect(pushRecentSearch([], '  chilli ')).toEqual(['chilli']);
  });

  it('caps the list at six entries', () => {
    const existing = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(pushRecentSearch(existing, 'g')).toEqual(['g', 'a', 'b', 'c', 'd', 'e']);
  });
});

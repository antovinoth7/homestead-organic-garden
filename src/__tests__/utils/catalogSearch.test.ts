import {
  buildCatalogSearchIndex,
  extendPastCombiningMarks,
  findCatalogPlant,
  pushRecentSearch,
  searchCatalog,
  splitAtSpan,
} from '@/utils/catalogSearch';
import type { CatalogSearchEntry, CatalogSearchResult } from '@/utils/catalogSearch';
import { makeCountsByType, makePlantProfile, makePlantProfiles } from '../fixtures/plant.fixtures';

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
const ladiesFinger = makePlantProfile({ plantType: 'vegetable', name: 'Ladies Finger' });
const basil = makePlantProfile({ plantType: 'herb', name: 'Basil' });
const mango = makePlantProfile({ plantType: 'fruit_tree', name: 'Mango' });

const profiles = makePlantProfiles([brinjal, longBrinjal, tomato, ladiesFinger, basil, mango]);
const counts = makeCountsByType({
  vegetable: { Brinjal: 2, Tomato: 5 },
  fruit_tree: { Mango: 1 },
});

const index = buildCatalogSearchIndex(profiles, counts);

/** Unwraps the outcome — most cases only care about the ordered results. */
const run = (
  entries: readonly CatalogSearchEntry[],
  query: string,
  limit?: number
): CatalogSearchResult[] => searchCatalog(entries, query, limit).results;

describe('buildCatalogSearchIndex', () => {
  it('flattens every category into one list', () => {
    expect(index).toHaveLength(6);
    expect(index.map((entry) => entry.name).sort()).toEqual([
      'Basil',
      'Brinjal',
      'Ladies Finger',
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

  it('attaches the known alternate names for each plant', () => {
    expect(index.find((item) => item.name === 'Ladies Finger')?.aliases).toEqual(
      expect.arrayContaining(['okra', 'vendakkai'])
    );
    expect(index.find((item) => item.name === 'Basil')?.aliases).toEqual([]);
  });
});

describe('searchCatalog', () => {
  it('returns nothing for an empty or whitespace query', () => {
    expect(run(index, '')).toEqual([]);
    expect(run(index, '   ')).toEqual([]);
  });

  it('matches across categories, not just one', () => {
    const results = run(index, 'a');
    const types = new Set(results.map((result) => result.plantType));
    expect(types.has('vegetable')).toBe(true);
    expect(types.has('herb')).toBe(true);
    expect(types.has('fruit_tree')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(run(index, 'BRINJAL').map((r) => r.name)).toEqual(['Brinjal', 'Long Brinjal']);
  });

  it('ranks prefix matches above substring matches', () => {
    expect(run(index, 'brin').map((result) => result.name)).toEqual(['Brinjal', 'Long Brinjal']);
  });

  it('matches on the Tamil name and reports which field hit', () => {
    const results = run(index, 'கத்தரிக்காய்');
    expect(results.map((result) => result.name).sort()).toEqual(['Brinjal', 'Long Brinjal']);
    expect(results.every((result) => result.matchedField === 'tamilName')).toBe(true);
    expect(results.every((result) => result.tamilSpan !== undefined)).toBe(true);
  });

  it('prefers the English name span when both fields match', () => {
    const bilingual: CatalogSearchEntry[] = [
      {
        plantType: 'vegetable',
        name: 'Keerai',
        tamilName: 'Keerai',
        aliases: [],
        tagLabels: [],
        gardenCount: 0,
      },
    ];
    const results = run(bilingual, 'keerai');
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ matchedField: 'name', nameSpan: { start: 0, end: 6 } });
    expect(results[0]?.tamilSpan).toBeUndefined();
  });

  it('returns spans that slice the ORIGINAL string back to the query', () => {
    for (const query of ['brin', 'Brinjal', 'ango', 'கத்தரிக்காய்']) {
      for (const result of run(index, query)) {
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
    expect(run(index, 'zzzz')).toEqual([]);
  });

  it('respects the result limit', () => {
    expect(run(index, 'a', 2)).toHaveLength(2);
  });

  it('reports the pre-limit total so the header can show how many were hidden', () => {
    const all = searchCatalog(index, 'a');
    const capped = searchCatalog(index, 'a', 2);
    expect(capped.results).toHaveLength(2);
    expect(capped.totalMatches).toBe(all.totalMatches);
    expect(capped.totalMatches).toBeGreaterThan(2);
  });

  describe('alias matching', () => {
    it('finds a plant by another name for the same crop', () => {
      const results = run(index, 'okra');
      expect(results.map((result) => result.name)).toEqual(['Ladies Finger']);
      expect(results[0]).toMatchObject({ matchedField: 'alias', matchedAlias: 'okra' });
    });

    it('finds a plant by its romanized Tamil name', () => {
      expect(run(index, 'vendakkai').map((result) => result.name)).toEqual(['Ladies Finger']);
    });

    it('ranks a direct name hit above an alias hit', () => {
      const withOkraEntry: CatalogSearchEntry[] = [
        ...index,
        { plantType: 'vegetable', name: 'Okra Bush', aliases: [], tagLabels: [], gardenCount: 0 },
      ];
      expect(run(withOkraEntry, 'okra').map((result) => result.name)).toEqual([
        'Okra Bush',
        'Ladies Finger',
      ]);
    });

    it('carries no highlight span for an alias hit', () => {
      const [result] = run(index, 'okra');
      expect(result?.nameSpan).toBeUndefined();
      expect(result?.tamilSpan).toBeUndefined();
    });
  });

  describe('multi-word matching', () => {
    it('matches when every word is present but not adjacent', () => {
      expect(run(index, 'lady finger').map((result) => result.name)).toContain('Ladies Finger');
    });

    it('matches words given out of order', () => {
      expect(run(index, 'brinjal long').map((result) => result.name)).toEqual(['Long Brinjal']);
    });

    it('still returns nothing when a word is absent', () => {
      expect(run(index, 'lady zzzz')).toEqual([]);
    });
  });

  describe('ranking', () => {
    it('puts plants already in the garden first within a tier', () => {
      const entries: CatalogSearchEntry[] = [
        { plantType: 'vegetable', name: 'Test Alpha', aliases: [], tagLabels: [], gardenCount: 0 },
        { plantType: 'vegetable', name: 'Test Beta', aliases: [], tagLabels: [], gardenCount: 4 },
      ];
      expect(run(entries, 'test').map((result) => result.name)).toEqual([
        'Test Beta',
        'Test Alpha',
      ]);
    });

    it('falls back to alphabetical when garden counts tie', () => {
      const entries: CatalogSearchEntry[] = [
        { plantType: 'vegetable', name: 'Test Beta', aliases: [], tagLabels: [], gardenCount: 0 },
        { plantType: 'vegetable', name: 'Test Alpha', aliases: [], tagLabels: [], gardenCount: 0 },
      ];
      expect(run(entries, 'test').map((result) => result.name)).toEqual([
        'Test Alpha',
        'Test Beta',
      ]);
    });
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

describe('tag search', () => {
  /** The real index, so the tags come from the taxonomy rather than a fixture. */
  const realIndex = buildCatalogSearchIndex(
    {
      spinach: { Amaranthus: {}, 'Ponnanganni Keerai': {}, Palak: {} },
      farm_support: {},
      vegetable: { Drumstick: {}, 'Bitter Gourd': {} },
      herb: {},
      flower: {},
      fruit_tree: {},
      timber_tree: {},
      coconut_tree: {},
      shrub: { Agathi: {}, Aavaram: {} },
    } as never,
    {} as never
  );

  const search = (needle: string): string[] =>
    searchCatalog(realIndex, needle).results.map((result) => result.name);

  it('finds the greens by what they are, not what they are called', () => {
    const hits = search('keerai');
    expect(hits).toContain('Amaranthus');
    expect(hits).toContain('Ponnanganni Keerai');
    // Drumstick is a vegetable, but its leaves are keerai — the tag is why it
    // shows up here at all.
    expect(hits).toContain('Drumstick');
  });

  it('finds the green-manure plants', () => {
    const hits = search('green manure');
    expect(hits).toContain('Agathi');
    expect(hits).toContain('Aavaram');
  });

  it('says which tag matched, so the row does not look unrelated', () => {
    const [first] = searchCatalog(realIndex, 'green manure').results;
    expect(first?.matchedField).toBe('tag');
    expect(first?.matchedTag).toBe('Green Manure');
  });

  it('ranks a name hit above a tag hit', () => {
    // "Ponnanganni Keerai" contains the word, so it must outrank plants that
    // merely carry the tag.
    expect(search('keerai')[0]).toBe('Ponnanganni Keerai');
  });
});

describe('findCatalogPlant', () => {
  const profiles = makePlantProfiles([
    makePlantProfile({ name: 'Ladies Finger', tamilName: 'வெண்டைக்காய்' }),
    makePlantProfile({ plantType: 'herb', name: 'Tulsi', tamilName: 'துளசி' }),
  ]);

  it('finds a plant by name, alias or exact Tamil name', () => {
    expect(findCatalogPlant(profiles, 'ladies finger')?.name).toBe('Ladies Finger');
    expect(findCatalogPlant(profiles, 'Okra')?.name).toBe('Ladies Finger');
    expect(findCatalogPlant(profiles, 'வெண்டைக்காய்')).toEqual({
      name: 'Ladies Finger',
      plantType: 'vegetable',
    });
  });

  it('finds nothing for a genuinely new plant or a blank query', () => {
    expect(findCatalogPlant(profiles, 'Dragon Fruit')).toBeUndefined();
    expect(findCatalogPlant(profiles, '  ')).toBeUndefined();
  });
});

describe('extendPastCombiningMarks', () => {
  it('keeps a Tamil vowel sign with its consonant', () => {
    const text = 'வெண்டைக்காய்';
    // "வெண்ட" ends on ட; the next code unit is the ை vowel sign.
    const end = extendPastCombiningMarks(text, 'வெண்ட'.length);
    expect(text.slice(0, end)).toBe('வெண்டை');
  });

  it('leaves a span that already ends on a full letter alone', () => {
    expect(extendPastCombiningMarks('abc', 2)).toBe(2);
  });
});

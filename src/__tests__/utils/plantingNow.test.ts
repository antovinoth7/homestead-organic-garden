import {
  mapSeasonTextToIds,
  candidateSeasonIds,
  getWhatToPlantNow,
  formatSuggestionSummary,
} from '@/utils/plantingNow';

describe('mapSeasonTextToIds', () => {
  it('maps "Year Round" to every season', () => {
    expect([...mapSeasonTextToIds('Year Round')].sort()).toEqual([
      'cool_dry',
      'ne_monsoon',
      'summer',
      'sw_monsoon',
    ]);
  });

  it('maps summer phrasing', () => {
    expect([...mapSeasonTextToIds('Summer (Feb–May)')]).toEqual(['summer']);
  });

  it('maps SW monsoon / Kharif phrasing', () => {
    expect(mapSeasonTextToIds('Southwest Monsoon (Jun-Sep)').has('sw_monsoon')).toBe(true);
    expect(mapSeasonTextToIds('Kharif (Jun–Sep)').has('sw_monsoon')).toBe(true);
  });

  it('maps Rabi/winter to cool_dry and ne_monsoon', () => {
    const ids = mapSeasonTextToIds('Rabi (Oct–Jan)');
    expect(ids.has('cool_dry')).toBe(true);
    expect(ids.has('ne_monsoon')).toBe(true);
  });

  it('returns empty for unknown/blank text', () => {
    expect(mapSeasonTextToIds('').size).toBe(0);
    expect(mapSeasonTextToIds('whenever').size).toBe(0);
  });
});

describe('candidateSeasonIds', () => {
  it('merges growingSeason and seasonSuitability', () => {
    const ids = candidateSeasonIds({
      plantType: 'vegetable',
      variety: 'Okra',
      growingSeason: 'Summer (Feb–May)',
      seasonSuitability: ['Kharif (Jun–Sep)'],
    });
    expect(ids.has('summer')).toBe(true);
    expect(ids.has('sw_monsoon')).toBe(true);
  });
});

describe('getWhatToPlantNow', () => {
  const candidates = [
    { plantType: 'vegetable' as const, variety: 'Okra', growingSeason: 'Summer (Feb–May)' },
    { plantType: 'vegetable' as const, variety: 'Spinach', growingSeason: 'Year Round' },
    { plantType: 'vegetable' as const, variety: 'Cowpea', growingSeason: 'Kharif (Jun–Sep)' },
    { plantType: 'vegetable' as const, variety: 'Mystery', growingSeason: '' },
  ];

  it('filters to varieties sowable in the current season and sorts by name', () => {
    const result = getWhatToPlantNow(candidates, 'summer');
    expect(result.map((r) => r.variety)).toEqual(['Okra', 'Spinach']);
  });

  it('excludes candidates with no recognizable season', () => {
    const result = getWhatToPlantNow(candidates, 'sw_monsoon');
    expect(result.map((r) => r.variety)).toEqual(['Cowpea', 'Spinach']);
    expect(result.some((r) => r.variety === 'Mystery')).toBe(false);
  });

  it('carries daysToHarvest through to the suggestion', () => {
    const [ashGourd] = getWhatToPlantNow(
      [
        {
          plantType: 'vegetable' as const,
          variety: 'Ash Gourd',
          growingSeason: 'Southwest Monsoon (Jun-Sep)',
          daysToHarvest: { min: 100, max: 140 },
        },
      ],
      'sw_monsoon'
    );
    expect(ashGourd?.daysToHarvest).toEqual({ min: 100, max: 140 });
  });

  it('still suggests a candidate whose profile carries no harvest range', () => {
    const [okra] = getWhatToPlantNow(candidates, 'summer');
    expect(okra?.variety).toBe('Okra');
    expect(okra?.daysToHarvest).toBeUndefined();
  });

  it('dedupes by plantType+variety', () => {
    const dupes = [
      { plantType: 'vegetable' as const, variety: 'Okra', growingSeason: 'Year Round' },
      { plantType: 'vegetable' as const, variety: 'Okra', growingSeason: 'Summer (Feb–May)' },
    ];
    expect(getWhatToPlantNow(dupes, 'summer')).toHaveLength(1);
  });
});

describe('formatSuggestionSummary', () => {
  const make = (...varieties: string[]): { plantType: 'vegetable'; variety: string }[] =>
    varieties.map((variety) => ({ plantType: 'vegetable' as const, variety }));

  it('returns an empty string for no suggestions', () => {
    expect(formatSuggestionSummary([])).toBe('');
  });

  it('lists every name when at or under the preview count', () => {
    expect(formatSuggestionSummary(make('Agathi', 'Aloe Vera'))).toBe('Agathi, Aloe Vera');
    expect(formatSuggestionSummary(make('Agathi', 'Aloe Vera', 'Amaranthus'))).toBe(
      'Agathi, Aloe Vera, Amaranthus'
    );
  });

  it('appends the remaining count past the preview', () => {
    const eight = make(
      'Agathi',
      'Aloe Vera',
      'Amaranthus',
      'Arecanut',
      'Ash Gourd',
      'Ash Plantain',
      'Avocado',
      'Bamboo'
    );
    expect(formatSuggestionSummary(eight)).toBe('Agathi, Aloe Vera, Amaranthus + 5 more');
  });

  it('honours a custom preview count', () => {
    expect(formatSuggestionSummary(make('A', 'B', 'C', 'D'), 1)).toBe('A + 3 more');
  });
});

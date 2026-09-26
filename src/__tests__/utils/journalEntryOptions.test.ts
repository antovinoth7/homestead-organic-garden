import {
  buildJournalPlantOptions,
  collectUsedTags,
  filterSuggestionGroups,
  formatJournalTimestamp,
  getMilestoneMeta,
  journalPickablePlants,
  harvestWeightKg,
  isActiveProblem,
  isWeightUnit,
  normalizeHarvestUnit,
  tagsForEntry,
} from '../../utils/journalEntryOptions';
import { JournalEntryType } from '../../types/database.types';
import { makeJournalEntry } from '../fixtures/journal.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';

describe('normalizeHarvestUnit', () => {
  it('maps legacy "pieces" to "pcs"', () => {
    expect(normalizeHarvestUnit('pieces')).toBe('pcs');
  });
  it('defaults null/undefined to "pcs"', () => {
    expect(normalizeHarvestUnit(null)).toBe('pcs');
    expect(normalizeHarvestUnit(undefined)).toBe('pcs');
  });
  it('passes through known units', () => {
    expect(normalizeHarvestUnit('kg')).toBe('kg');
  });
});

describe('isWeightUnit / harvestWeightKg', () => {
  it('recognises weight units', () => {
    expect(isWeightUnit('kg')).toBe(true);
    expect(isWeightUnit('g')).toBe(true);
    expect(isWeightUnit('lbs')).toBe(true);
    expect(isWeightUnit('pcs')).toBe(false);
    expect(isWeightUnit('bunches')).toBe(false);
  });
  it('returns null for count units', () => {
    expect(harvestWeightKg(5, 'pcs')).toBeNull();
    expect(harvestWeightKg(5, 'bunches')).toBeNull();
    expect(harvestWeightKg(5, 'pieces')).toBeNull();
  });
  it('converts weight units', () => {
    expect(harvestWeightKg(2, 'kg')).toBe(2);
    expect(harvestWeightKg(500, 'g')).toBe(0.5);
    expect(harvestWeightKg(1, 'lbs')).toBeCloseTo(0.4536, 3);
  });
  it('returns null for missing quantity', () => {
    expect(harvestWeightKg(null, 'kg')).toBeNull();
  });
});

describe('tagsForEntry', () => {
  it('returns the observation tag set', () => {
    const tags = tagsForEntry(JournalEntryType.Observation);
    expect(tags).toContain('growth_update');
    expect(tags).toContain('weather_damage');
  });
  it('returns no base tags for structured types', () => {
    expect(tagsForEntry(JournalEntryType.Harvest)).toEqual([]);
    expect(tagsForEntry(JournalEntryType.PestDisease)).toEqual([]);
    expect(tagsForEntry(JournalEntryType.Milestone)).toEqual([]);
  });
  it('unions legacy tags on the edited entry without duplicates', () => {
    const tags = tagsForEntry(JournalEntryType.Observation, ['growth_update', 'legacy_tag']);
    expect(tags).toContain('legacy_tag');
    expect(tags.filter((t) => t === 'growth_update')).toHaveLength(1);
  });
});

describe('collectUsedTags', () => {
  it('returns distinct tags across entries', () => {
    const entries = [
      makeJournalEntry({ tags: ['pest', 'harvest'] }),
      makeJournalEntry({ tags: ['harvest', 'experiment'] }),
      makeJournalEntry({ tags: undefined }),
    ];
    const tags = collectUsedTags(entries);
    expect(tags.sort()).toEqual(['experiment', 'harvest', 'pest']);
  });
});

describe('getMilestoneMeta', () => {
  it('resolves a known kind', () => {
    expect(getMilestoneMeta('first_flower').label).toBe('First Flower');
  });
  it('falls back for null/unknown', () => {
    expect(getMilestoneMeta(null).label).toBe('Milestone');
  });
});

describe('isActiveProblem', () => {
  it('is true for unresolved pest entries', () => {
    expect(
      isActiveProblem(
        makeJournalEntry({ entry_type: JournalEntryType.PestDisease, pest_status: 'active' })
      )
    ).toBe(true);
  });
  it('is false for resolved and non-pest entries', () => {
    expect(
      isActiveProblem(
        makeJournalEntry({ entry_type: JournalEntryType.PestDisease, pest_status: 'resolved' })
      )
    ).toBe(false);
    expect(isActiveProblem(makeJournalEntry({ entry_type: JournalEntryType.Harvest }))).toBe(false);
  });
});

describe('buildJournalPlantOptions', () => {
  const beds = new Map([['bed-3', 'Bed 3']]);

  it('subtitles bed plants with the bed name and sorts by name', () => {
    const options = buildJournalPlantOptions(
      [
        makePlant({ id: 'b', name: 'Tomato', bed_id: 'bed-3' }),
        makePlant({ id: 'a', name: 'Chilli', bed_id: 'bed-3' }),
      ],
      beds
    );
    expect(options).toEqual([
      { label: 'Chilli', value: 'a', description: 'Bed 3' },
      { label: 'Tomato', value: 'b', description: 'Bed 3' },
    ]);
  });

  it('falls back to the location, marking pots', () => {
    const [option] = buildJournalPlantOptions(
      [makePlant({ space_type: 'pot', location: 'Home - Terrace', bed_id: null })],
      beds
    );
    expect(option?.description).toBe('Pot · Home · Terrace');
  });

  it('falls back to the space type when there is no location', () => {
    const [option] = buildJournalPlantOptions(
      [makePlant({ space_type: 'ground', location: '', bed_id: null })],
      beds
    );
    expect(option?.description).toBe('Ground');
  });

  it('leads with the variety and tells same-named plants apart', () => {
    const options = buildJournalPlantOptions(
      [
        makePlant({ id: '1', name: 'Tomato', plant_variety: 'PKM 1', bed_id: 'bed-3' }),
        makePlant({ id: '2', name: 'Tomato', space_type: 'pot', location: 'Terrace' }),
      ],
      beds
    );
    expect(options.map((o) => o.description)).toEqual(['PKM 1 · Bed 3', 'Pot · Terrace']);
  });

  it('uses the bed_name snapshot when the bed id is unknown', () => {
    const [option] = buildJournalPlantOptions(
      [makePlant({ bed_id: 'gone', bed_name: 'Old Bed' })],
      beds
    );
    expect(option?.description).toBe('Old Bed');
  });
});

describe('formatJournalTimestamp', () => {
  const now = new Date(2026, 8, 26, 18, 0);

  it('labels today and yesterday with the time', () => {
    expect(formatJournalTimestamp(new Date(2026, 8, 26, 7, 30).toISOString(), now)).toMatch(
      /^Today · 7:30/
    );
    expect(formatJournalTimestamp(new Date(2026, 8, 25, 21, 5).toISOString(), now)).toMatch(
      /^Yesterday · 9:05/
    );
  });

  it('shows day and month with the time earlier this year', () => {
    expect(formatJournalTimestamp(new Date(2026, 8, 12, 7, 30).toISOString(), now)).toMatch(
      /^12 Sept? · 7:30/
    );
  });

  it('shows the year, without a time, for past years', () => {
    expect(formatJournalTimestamp(new Date(2025, 0, 3, 7, 30).toISOString(), now)).toBe(
      '3 Jan 2025'
    );
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatJournalTimestamp('not-a-date', now)).toBe('');
  });
});

describe('journalPickablePlants', () => {
  const pot = makePlant({ id: 'pot', space_type: 'pot', bed_id: null });
  const ground = makePlant({ id: 'ground', space_type: 'ground', bed_id: null });
  const inBed = makePlant({ id: 'in-bed', space_type: 'bed', bed_id: 'bed-3' });
  const bedTypeNoId = makePlant({ id: 'bed-type', space_type: 'bed', bed_id: null });
  const plants = [pot, ground, inBed, bedTypeNoId];

  it('offers only pot and ground plants', () => {
    expect(journalPickablePlants(plants, null).map((p) => p.id)).toEqual(['pot', 'ground']);
  });

  it('keeps a linked bed plant so an older entry shows its link', () => {
    expect(journalPickablePlants(plants, 'in-bed').map((p) => p.id)).toEqual([
      'pot',
      'ground',
      'in-bed',
    ]);
  });

  it('does not duplicate a linked pot plant', () => {
    expect(journalPickablePlants(plants, 'pot').map((p) => p.id)).toEqual(['pot', 'ground']);
  });
});

describe('filterSuggestionGroups', () => {
  const groups = [
    { category: 'Sap-Sucking', emoji: '', items: ['Aphids', 'Whitefly', 'Mealybug'] },
    { category: 'Chewing', emoji: '', items: ['Fruit Borer', 'Leaf Miner'] },
  ];

  it('shows every group for an empty name', () => {
    expect(filterSuggestionGroups(groups, '  ')).toEqual(groups);
  });

  it('narrows items case-insensitively and drops groups left empty', () => {
    expect(filterSuggestionGroups(groups, 'fly')).toEqual([
      { category: 'Sap-Sucking', emoji: '', items: ['Whitefly'] },
    ]);
  });

  it('keeps every group that still has a match', () => {
    expect(filterSuggestionGroups(groups, 'e').map((g) => g.category)).toEqual([
      'Sap-Sucking',
      'Chewing',
    ]);
  });

  it('hides the list once the name is an exact preset', () => {
    expect(filterSuggestionGroups(groups, 'aphids')).toEqual([]);
  });

  it('does not mutate the input groups', () => {
    filterSuggestionGroups(groups, 'fly');
    expect(groups[0]?.items).toHaveLength(3);
  });
});

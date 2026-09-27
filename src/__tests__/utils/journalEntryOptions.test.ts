import {
  buildJournalPlantOptions,
  collectUsedLocations,
  collectUsedTags,
  daysOpen,
  entryMatchesLocation,
  formatDaysOpen,
  journalEntryHeadline,
  journalEntryLocation,
  journalTypeLabel,
  lastHarvestUnit,
  recheckIntervalDays,
  filterSuggestionGroups,
  formatEntryDateLabel,
  formatJournalTimestamp,
  getMilestoneMeta,
  journalPickablePlants,
  harvestWeightKg,
  isActiveProblem,
  isWeightUnit,
  journalEntryTimestamp,
  normalizeHarvestUnit,
  tagsForEntry,
} from '../../utils/journalEntryOptions';
import { JournalEntry, JournalEntryType } from '../../types/database.types';
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

describe('journalEntryTimestamp', () => {
  const now = new Date(2026, 8, 27, 18, 45, 10);

  it('puts a backdated day at the given time of day', () => {
    const result = journalEntryTimestamp(new Date(2026, 8, 25), now, now);
    expect(result).toEqual(new Date(2026, 8, 25, 18, 45, 10));
  });

  it('keeps an edited entry at its original time when its date moves', () => {
    const original = new Date(2026, 8, 20, 7, 5);
    expect(journalEntryTimestamp(new Date(2026, 8, 18), original, now)).toEqual(
      new Date(2026, 8, 18, 7, 5)
    );
  });

  it('never lands in the future when today is picked with a later time', () => {
    const lateOriginal = new Date(2026, 8, 20, 22, 0);
    expect(journalEntryTimestamp(new Date(2026, 8, 27), lateOriginal, now)).toEqual(now);
  });

  it('crosses month and year boundaries using local dates', () => {
    const result = journalEntryTimestamp(new Date(2025, 11, 31), new Date(2026, 0, 1, 6, 0), now);
    expect(result).toEqual(new Date(2025, 11, 31, 6, 0));
  });
});

describe('formatEntryDateLabel', () => {
  const now = new Date(2026, 8, 27, 10, 0);

  it('names today and yesterday', () => {
    expect(formatEntryDateLabel(new Date(2026, 8, 27, 23, 0), now)).toBe('Today');
    expect(formatEntryDateLabel(new Date(2026, 8, 26, 1, 0), now)).toBe('Yesterday');
  });

  it('shows weekday, day and month earlier this year', () => {
    expect(formatEntryDateLabel(new Date(2026, 8, 22), now)).toMatch(/^Tue,? 22 Sept?$/);
  });

  it('adds the year for past years', () => {
    expect(formatEntryDateLabel(new Date(2025, 0, 3), now)).toMatch(/^Fri,? 3 Jan 2025$/);
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

describe('journalTypeLabel', () => {
  it('labels current and legacy types, never the raw value', () => {
    expect(journalTypeLabel(JournalEntryType.PestDisease)).toBe('Pest/Disease');
    expect(journalTypeLabel(JournalEntryType.Harvest)).toBe('Harvest');
    expect(journalTypeLabel(JournalEntryType.Issue)).toBe('Issue');
    expect(journalTypeLabel(JournalEntryType.Other)).toBe('Other');
  });
});

describe('journalEntryHeadline', () => {
  it('summarises a harvest amount, unit and tree', () => {
    const entry = makeJournalEntry({
      entry_type: JournalEntryType.Harvest,
      harvest_quantity: 12,
      harvest_unit: 'pieces',
      harvest_tree_number: 3,
    });
    expect(journalEntryHeadline(entry)).toBe('Harvested 12 pcs · Tree 3');
  });

  it('falls back to "Harvested" without an amount', () => {
    const entry = makeJournalEntry({ entry_type: JournalEntryType.Harvest });
    expect(journalEntryHeadline(entry)).toBe('Harvested');
  });

  it('names the pest and the parts it is on', () => {
    const entry = makeJournalEntry({
      entry_type: JournalEntryType.PestDisease,
      pest_name: 'Aphids',
      pest_affected_parts: ['Leaf', 'Whole Plant'],
    });
    expect(journalEntryHeadline(entry)).toBe('Aphids on leaf, whole plant');
  });

  it('uses the kind when the pest/disease has no name', () => {
    const entry = makeJournalEntry({
      entry_type: JournalEntryType.PestDisease,
      pest_kind: 'disease',
    });
    expect(journalEntryHeadline(entry)).toBe('Disease');
  });

  it('is null for observations and milestones', () => {
    expect(journalEntryHeadline(makeJournalEntry())).toBeNull();
    expect(
      journalEntryHeadline(makeJournalEntry({ entry_type: JournalEntryType.Milestone }))
    ).toBeNull();
  });
});

describe('daysOpen / formatDaysOpen', () => {
  const now = new Date(2026, 8, 27, 9, 0);

  it('counts whole days from the observed date', () => {
    const entry = makeJournalEntry({
      entry_type: JournalEntryType.PestDisease,
      pest_status: 'active',
      pest_occurred_at: '2026-09-21',
      created_at: new Date(2026, 8, 25).toISOString(),
    });
    expect(daysOpen(entry, now)).toBe(6);
  });

  it('falls back to the logged date and treats a missing status as open', () => {
    const entry = makeJournalEntry({
      entry_type: JournalEntryType.PestDisease,
      created_at: new Date(2026, 8, 26, 22, 0).toISOString(),
    });
    expect(daysOpen(entry, now)).toBe(1);
  });

  it('is null once resolved and for other types', () => {
    const resolved = makeJournalEntry({
      entry_type: JournalEntryType.PestDisease,
      pest_status: 'resolved',
    });
    expect(daysOpen(resolved, now)).toBeNull();
    expect(daysOpen(makeJournalEntry(), now)).toBeNull();
  });

  it('never goes negative for a future observed date', () => {
    const entry = makeJournalEntry({
      entry_type: JournalEntryType.PestDisease,
      pest_occurred_at: '2026-09-30',
    });
    expect(daysOpen(entry, now)).toBe(0);
  });

  it('formats the count', () => {
    expect(formatDaysOpen(0)).toBe('since today');
    expect(formatDaysOpen(1)).toBe('1 day');
    expect(formatDaysOpen(6)).toBe('6 days');
  });
});

describe('recheckIntervalDays', () => {
  it('takes the lower bound of a day range', () => {
    expect(recheckIntervalDays('Every 5–7 days until infestation clears')).toBe(5);
    expect(recheckIntervalDays('Every 3-5 days')).toBe(3);
  });

  it('converts weeks and weekly', () => {
    expect(recheckIntervalDays('Two applications, every 2 weeks')).toBe(14);
    expect(recheckIntervalDays('Weekly releases for 6–8 weeks')).toBe(7);
  });

  it('prefers a day interval over a longer one in the same text', () => {
    expect(recheckIntervalDays('Change lures every 6–8 weeks; inspect every 3 days')).toBe(3);
  });

  it('is null when no usable interval is named', () => {
    expect(recheckIntervalDays('Every 2–3 months')).toBeNull();
    expect(recheckIntervalDays('Single release; repeat if population resurges')).toBeNull();
    expect(recheckIntervalDays('Every 45 days')).toBeNull();
    expect(recheckIntervalDays(undefined)).toBeNull();
  });
});

describe('lastHarvestUnit', () => {
  const harvest = (plantId: string, unit: string, createdAt: string): JournalEntry =>
    makeJournalEntry({
      id: `${plantId}-${createdAt}`,
      entry_type: JournalEntryType.Harvest,
      plant_id: plantId,
      harvest_unit: unit,
      created_at: createdAt,
    });

  it("returns the plant's most recent harvest unit", () => {
    const entries = [
      harvest('coconut', 'bunches', '2026-08-01T00:00:00.000Z'),
      harvest('coconut', 'pieces', '2026-09-01T00:00:00.000Z'),
      harvest('tomato', 'kg', '2026-09-20T00:00:00.000Z'),
    ];
    expect(lastHarvestUnit(entries, 'coconut')).toBe('pcs');
    expect(lastHarvestUnit(entries, 'tomato')).toBe('kg');
  });

  it('is null with no harvest, or a unit no longer offered', () => {
    expect(lastHarvestUnit([], 'coconut')).toBeNull();
    expect(
      lastHarvestUnit([harvest('mango', 'lbs', '2026-09-01T00:00:00.000Z')], 'mango')
    ).toBeNull();
  });
});

describe('entry locations', () => {
  const mango = makePlant({ id: 'mango', name: 'Mango', bed_id: null });
  const beans = makePlant({ id: 'beans', name: 'Beans', bed_id: 'bed-3' });
  const plantById = new Map([mango, beans].map((p) => [p.id, p]));
  const beds = [
    { id: 'bed-3', name: 'Bed 3' },
    { id: 'bed-9', name: 'Bed 9' },
  ];
  const bedNameById = new Map(beds.map((b) => [b.id, b.name]));

  const onMango = makeJournalEntry({ id: 'e1', plant_id: 'mango' });
  const onBed = makeJournalEntry({ id: 'e2', bed_id: 'bed-3' });
  const onBedPlant = makeJournalEntry({ id: 'e3', plant_id: 'beans' });

  it('names the plant first, else the bed', () => {
    expect(journalEntryLocation(onMango, plantById, bedNameById)).toEqual({
      kind: 'plant',
      label: 'Mango',
    });
    expect(journalEntryLocation(onBed, plantById, bedNameById)).toEqual({
      kind: 'bed',
      label: 'Bed 3',
    });
    expect(journalEntryLocation(makeJournalEntry(), plantById, bedNameById)).toBeNull();
  });

  it('offers used beds, then pot/ground plants — never bed plants or unused beds', () => {
    const options = collectUsedLocations([onMango, onBed, onBedPlant], plantById, beds);
    expect(options.map((o) => o.label)).toEqual(['Bed 3', 'Mango']);
  });

  it("matches a bed's own entries and entries on plants growing in it", () => {
    const key = 'bed:bed-3';
    expect(entryMatchesLocation(onBed, key, plantById)).toBe(true);
    expect(entryMatchesLocation(onBedPlant, key, plantById)).toBe(true);
    expect(entryMatchesLocation(onMango, key, plantById)).toBe(false);
    expect(entryMatchesLocation(onMango, 'plant:mango', plantById)).toBe(true);
  });
});

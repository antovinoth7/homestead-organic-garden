import {
  collectUsedTags,
  getMilestoneMeta,
  harvestWeightKg,
  isActiveProblem,
  isWeightUnit,
  normalizeHarvestUnit,
  tagsForEntry,
} from '../../utils/journalEntryOptions';
import { JournalEntryType } from '../../types/database.types';
import { makeJournalEntry } from '../fixtures/journal.fixtures';

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
    expect(isActiveProblem(makeJournalEntry({ entry_type: JournalEntryType.Harvest }))).toBe(
      false
    );
  });
});

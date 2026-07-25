import {
  firstJournalErrorField,
  journalFormErrors,
} from '@/hooks/journalFormValidation';
import type { JournalFormValidationInput } from '@/hooks/journalFormValidation';
import { JournalEntryType } from '@/types/database.types';

const base: JournalFormValidationInput = {
  entryType: JournalEntryType.Observation,
  content: 'Beans are flowering',
  harvestQuantity: '',
  pestName: '',
  milestoneKind: null,
};

const noErrors = { quantity: [], pestName: [], milestone: [], content: [] };

describe('journalFormErrors — content', () => {
  it('accepts a valid observation', () => {
    expect(journalFormErrors(base)).toEqual(noErrors);
  });

  it('requires content on free-form types', () => {
    expect(journalFormErrors({ ...base, content: '   ' }).content).toEqual([
      'Please write something in your journal',
    ]);
  });

  it('requires at least 3 characters', () => {
    expect(journalFormErrors({ ...base, content: 'ok' }).content).toEqual([
      'Journal entry must be at least 3 characters long',
    ]);
  });

  it('rejects content over 5000 characters', () => {
    expect(journalFormErrors({ ...base, content: 'x'.repeat(5001) }).content).toEqual([
      'Journal entry must be less than 5000 characters',
    ]);
  });

  it('leaves content optional for structured types', () => {
    expect(
      journalFormErrors({
        ...base,
        entryType: JournalEntryType.Harvest,
        content: '',
        harvestQuantity: '2',
      })
    ).toEqual(noErrors);
  });

  it('still caps content length on structured types', () => {
    expect(
      journalFormErrors({
        ...base,
        entryType: JournalEntryType.Harvest,
        harvestQuantity: '2',
        content: 'x'.repeat(5001),
      }).content
    ).toHaveLength(1);
  });

  it('requires content on the legacy issue type', () => {
    expect(
      journalFormErrors({ ...base, entryType: JournalEntryType.Issue, content: '' }).content
    ).toHaveLength(1);
  });
});

describe('journalFormErrors — harvest quantity', () => {
  const harvest = (harvestQuantity: string): JournalFormValidationInput => ({
    ...base,
    entryType: JournalEntryType.Harvest,
    content: '',
    harvestQuantity,
  });

  it('accepts a decimal amount', () => {
    expect(journalFormErrors(harvest('2.5'))).toEqual(noErrors);
  });

  it('requires an amount', () => {
    expect(journalFormErrors(harvest('  ')).quantity).toEqual(['Please enter harvest quantity']);
  });

  it('rejects zero and negatives', () => {
    expect(journalFormErrors(harvest('0')).quantity).toEqual([
      'Harvest quantity must be a positive number',
    ]);
    expect(journalFormErrors(harvest('-3')).quantity).toHaveLength(1);
  });

  it('rejects non-numeric input', () => {
    expect(journalFormErrors(harvest('abc')).quantity).toEqual([
      'Harvest quantity must be a positive number',
    ]);
  });

  it('rejects implausibly large amounts', () => {
    expect(journalFormErrors(harvest('100001')).quantity).toEqual([
      'Harvest quantity seems too large. Please check your input.',
    ]);
    expect(journalFormErrors(harvest('100000')).quantity).toEqual([]);
  });

  it('ignores the amount on non-harvest types', () => {
    expect(journalFormErrors({ ...base, harvestQuantity: '' }).quantity).toEqual([]);
  });
});

describe('journalFormErrors — pest and milestone', () => {
  it('requires a pest/disease name', () => {
    expect(
      journalFormErrors({ ...base, entryType: JournalEntryType.PestDisease, content: '' })
        .pestName
    ).toEqual(['Please enter a pest or disease name']);
  });

  it('accepts a named pest entry', () => {
    expect(
      journalFormErrors({
        ...base,
        entryType: JournalEntryType.PestDisease,
        content: '',
        pestName: 'Aphids',
      })
    ).toEqual(noErrors);
  });

  it('requires a milestone kind', () => {
    expect(
      journalFormErrors({ ...base, entryType: JournalEntryType.Milestone, content: '' }).milestone
    ).toEqual(['Please choose a milestone']);
  });

  it('accepts a chosen milestone', () => {
    expect(
      journalFormErrors({
        ...base,
        entryType: JournalEntryType.Milestone,
        content: '',
        milestoneKind: 'first_flower',
      })
    ).toEqual(noErrors);
  });
});

describe('journalFormErrors — cross-type scoping', () => {
  // Every type-specific field left blank at once: only the active type's field
  // may complain, so the form never reports errors for a hidden section.
  const allBlank: JournalFormValidationInput = {
    ...base,
    content: '',
    harvestQuantity: '',
    pestName: '',
    milestoneKind: null,
  };

  const cases: [JournalEntryType, keyof typeof noErrors][] = [
    [JournalEntryType.Harvest, 'quantity'],
    [JournalEntryType.PestDisease, 'pestName'],
    [JournalEntryType.Milestone, 'milestone'],
    [JournalEntryType.Observation, 'content'],
  ];

  it.each(cases)('%s flags only its own field', (entryType, expectedField) => {
    const errors = journalFormErrors({ ...allBlank, entryType });
    expect(firstJournalErrorField(errors)).toBe(expectedField);
    for (const key of Object.keys(noErrors) as (keyof typeof noErrors)[]) {
      if (key !== expectedField) {
        expect(errors[key]).toEqual([]);
      }
    }
  });
});

describe('firstJournalErrorField', () => {
  it('returns null when the form is clear', () => {
    expect(firstJournalErrorField(journalFormErrors(base))).toBeNull();
  });

  it('reports the structured field ahead of content', () => {
    const errors = journalFormErrors({
      ...base,
      entryType: JournalEntryType.Harvest,
      content: 'x'.repeat(5001),
      harvestQuantity: '',
    });
    expect(firstJournalErrorField(errors)).toBe('quantity');
  });

  it('falls back to content', () => {
    expect(firstJournalErrorField(journalFormErrors({ ...base, content: '' }))).toBe('content');
  });
});

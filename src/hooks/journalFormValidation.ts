/**
 * Pure validation helpers for the journal entry form. Extracted from
 * JournalFormScreen so the rules are unit-testable and the screen can render
 * inline field errors, mirroring plantFormValidation.ts.
 */

import { JournalEntryType, MilestoneKind } from '@/types/database.types';

/** Fields that can carry an inline error, in visual (top-to-bottom) order. */
export type JournalFieldKey = 'quantity' | 'pestName' | 'milestone' | 'content';

export const JOURNAL_FIELD_ORDER: JournalFieldKey[] = [
  'quantity',
  'pestName',
  'milestone',
  'content',
];

export const CONTENT_MAX_LENGTH = 5000;
export const CONTENT_MIN_LENGTH = 3;
export const HARVEST_QUANTITY_MAX = 100000;

export interface JournalFormValidationInput {
  entryType: JournalEntryType;
  content: string;
  harvestQuantity: string;
  pestName: string;
  milestoneKind: MilestoneKind | null;
}

export type JournalValidationErrors = Record<JournalFieldKey, string[]>;

/**
 * Inline errors keyed by field. Structured types (harvest / pest / milestone)
 * capture their data in dedicated fields, so their notes stay optional; only
 * free-form types require a body.
 */
export function journalFormErrors(input: JournalFormValidationInput): JournalValidationErrors {
  const errors: JournalValidationErrors = {
    quantity: [],
    pestName: [],
    milestone: [],
    content: [],
  };

  const isHarvest = input.entryType === JournalEntryType.Harvest;
  const isPest = input.entryType === JournalEntryType.PestDisease;
  const isMilestone = input.entryType === JournalEntryType.Milestone;
  const contentRequired = !isHarvest && !isPest && !isMilestone;
  const trimmedContent = input.content.trim();

  if (contentRequired) {
    if (!trimmedContent) {
      errors.content.push('Please write something in your journal');
    } else if (trimmedContent.length < CONTENT_MIN_LENGTH) {
      errors.content.push(
        `Journal entry must be at least ${CONTENT_MIN_LENGTH} characters long`
      );
    }
  }
  if (trimmedContent.length > CONTENT_MAX_LENGTH) {
    errors.content.push(`Journal entry must be less than ${CONTENT_MAX_LENGTH} characters`);
  }

  if (isHarvest) {
    const raw = input.harvestQuantity.trim();
    if (raw === '') {
      errors.quantity.push('Please enter harvest quantity');
    } else {
      const quantity = parseFloat(raw);
      if (isNaN(quantity) || quantity <= 0) {
        errors.quantity.push('Harvest quantity must be a positive number');
      } else if (quantity > HARVEST_QUANTITY_MAX) {
        errors.quantity.push('Harvest quantity seems too large. Please check your input.');
      }
    }
  }

  if (isPest && !input.pestName.trim()) {
    errors.pestName.push('Please enter a pest or disease name');
  }

  if (isMilestone && !input.milestoneKind) {
    errors.milestone.push('Please choose a milestone');
  }

  return errors;
}

/** First field (in visual order) carrying an error, or null when the form is clear. */
export function firstJournalErrorField(errors: JournalValidationErrors): JournalFieldKey | null {
  return JOURNAL_FIELD_ORDER.find((key) => errors[key].length > 0) ?? null;
}

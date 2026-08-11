import type { CareFormState } from '@/utils/catalogDraft';
import type { CatalogErrors } from '@/utils/catalogValidation';
import type { PickerOption } from '@/components/OptionPickerSheet';

export interface TextSheetConfig {
  title: string;
  value: string;
  onCommit: (next: string) => void;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  sanitize?: (raw: string) => string;
  placeholder?: string;
  helpText?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words';
}

export interface PickerSheetConfig {
  title: string;
  options: readonly PickerOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
  allowClear?: boolean;
}

export interface RangeSheetConfig {
  title: string;
  min: string;
  max: string;
  minLabel?: string;
  maxLabel?: string;
  decimal?: boolean;
  helpText?: string;
  onCommit: (min: string, max: string) => void;
}

/**
 * Everything a section card needs to render read-first rows and open the right
 * editor. Passed as one object so sections take a single prop instead of a
 * dozen threaded callbacks.
 */
export interface CatalogEditor {
  careForm: CareFormState;
  setForm: (patch: Partial<CareFormState>) => void;
  errors: CatalogErrors;
  showErrors: boolean;
  openText: (config: TextSheetConfig) => void;
  openPicker: (config: PickerSheetConfig) => void;
  openRange: (config: RangeSheetConfig) => void;
}

/** Builds picker options from a label map keyed by an enum value. */
export function optionsFromLabels<K extends string>(
  labels: Record<K, string>,
  descriptions?: Partial<Record<K, string>>
): PickerOption[] {
  return (Object.keys(labels) as K[]).map((value) => ({
    value,
    label: labels[value],
    description: descriptions?.[value],
  }));
}

/** Builds picker options from a plain list of strings (e.g. growing seasons). */
export function optionsFromValues(values: readonly string[]): PickerOption[] {
  return values.map((value) => ({ value, label: value }));
}

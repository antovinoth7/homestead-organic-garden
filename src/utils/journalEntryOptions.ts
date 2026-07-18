import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  HarvestUnit,
  IssueSeverity,
  JournalEntry,
  JournalEntryType,
  MilestoneKind,
  PestStatus,
} from '../types/database.types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Harvest units ───────────────────────────────────────────────────────────
/** Units offered in the harvest form (weight + count). */
export const HARVEST_UNITS: readonly HarvestUnit[] = ['pcs', 'kg', 'g', 'bunches'];

/** Map legacy stored units onto the current vocabulary for display. */
export function normalizeHarvestUnit(unit: string | null | undefined): string {
  if (!unit) return 'pcs';
  if (unit === 'pieces') return 'pcs';
  return unit;
}

/** Weight units contribute to the kg total; count units (pcs/bunches) do not. */
export function isWeightUnit(unit: string | null | undefined): boolean {
  return unit === 'kg' || unit === 'g' || unit === 'lbs';
}

/**
 * Convert a harvest quantity to kilograms. Returns null for count-based units
 * (pcs, pieces, bunches) so they are never summed into a weight total.
 */
export function harvestWeightKg(
  quantity: number | null | undefined,
  unit: string | null | undefined
): number | null {
  if (quantity == null || Number.isNaN(quantity)) return null;
  switch (unit) {
    case 'kg':
      return quantity;
    case 'g':
      return quantity / 1000;
    case 'lbs':
      return quantity * 0.453592;
    default:
      return null;
  }
}

// ─── Pest / disease ──────────────────────────────────────────────────────────
export const AFFECTED_PARTS: readonly string[] = [
  'Leaf',
  'Stem',
  'Fruit',
  'Root',
  'Flower',
  'Bark',
  'Whole Plant',
];

export const PEST_SEVERITY_OPTIONS: { value: IssueSeverity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'severe', label: 'Severe' },
];

export const PEST_STATUS_OPTIONS: { value: PestStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'treated', label: 'Treated' },
  { value: 'resolved', label: 'Resolved' },
];

/** An active problem is a pest/disease entry not yet resolved (null = active). */
export function isActiveProblem(entry: JournalEntry): boolean {
  return (
    entry.entry_type === JournalEntryType.PestDisease && entry.pest_status !== 'resolved'
  );
}

// ─── Milestones ──────────────────────────────────────────────────────────────
export interface MilestoneOption {
  value: MilestoneKind;
  label: string;
  icon: IoniconName;
}

export const MILESTONE_KINDS: MilestoneOption[] = [
  { value: 'germinated', label: 'Germinated', icon: 'leaf' },
  { value: 'first_flower', label: 'First Flower', icon: 'flower' },
  { value: 'first_fruit', label: 'First Fruit', icon: 'nutrition' },
  { value: 'first_harvest', label: 'First Harvest', icon: 'basket' },
  { value: 'transplanted', label: 'Transplanted', icon: 'swap-horizontal' },
  { value: 'pruned', label: 'Pruned', icon: 'cut' },
  { value: 'season_end', label: 'Season End', icon: 'flag' },
  { value: 'custom', label: 'Custom', icon: 'star' },
];

const MILESTONE_FALLBACK: MilestoneOption = {
  value: 'custom',
  label: 'Milestone',
  icon: 'flag',
};

export function getMilestoneMeta(kind: MilestoneKind | null | undefined): MilestoneOption {
  if (!kind) return MILESTONE_FALLBACK;
  return MILESTONE_KINDS.find((m) => m.value === kind) ?? MILESTONE_FALLBACK;
}

// ─── Tags per entry type ─────────────────────────────────────────────────────
/**
 * Tags relevant to each entry type. Structured types (harvest, pest/disease,
 * milestone) capture their own fields and expose no free tags. Legacy 'issue'
 * and 'other' entries reuse the observation set.
 */
export const TAGS_BY_TYPE: Partial<Record<JournalEntryType, readonly string[]>> = {
  [JournalEntryType.Observation]: [
    'growth_update',
    'experiment',
    'weather_damage',
    'soil_prep',
  ],
  [JournalEntryType.Harvest]: [],
  [JournalEntryType.PestDisease]: [],
  [JournalEntryType.Milestone]: [],
  [JournalEntryType.Issue]: [
    'growth_update',
    'experiment',
    'weather_damage',
    'soil_prep',
  ],
  [JournalEntryType.Other]: [
    'growth_update',
    'experiment',
    'weather_damage',
    'soil_prep',
  ],
};

/**
 * Tags selectable for a given entry type, unioned with any legacy tags already
 * on the entry being edited (so old tags stay visible and removable).
 */
export function tagsForEntry(
  type: JournalEntryType,
  existingTags?: string[] | null
): string[] {
  const base = TAGS_BY_TYPE[type] ?? [];
  const merged = [...base];
  for (const tag of existingTags ?? []) {
    if (!merged.includes(tag)) merged.push(tag);
  }
  return merged;
}

/** Distinct tags in use across entries, for the filter sheet. */
export function collectUsedTags(entries: JournalEntry[]): string[] {
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const tag of entry.tags ?? []) {
      seen.add(tag);
    }
  }
  return Array.from(seen);
}

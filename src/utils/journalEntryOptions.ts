import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  HarvestUnit,
  IssueSeverity,
  JournalEntry,
  JournalEntryType,
  MilestoneKind,
  PestStatus,
  Plant,
  SpaceType,
} from '../types/database.types';
import type { PickerOption } from '@/components/OptionPickerSheet';
import { parseLocation } from '@/utils/locationHelpers';

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

/**
 * Unit conversion lives in `harvestStats.ts`, which is contractually free of
 * React-Native imports so `alertsLogic.ts` can share its harvest rules. This
 * module imports `@expo/vector-icons`, so the dependency can only run one way —
 * re-exported here for the call sites that already reach for it.
 */
export { isWeightUnit, harvestWeightKg } from './harvestStats';

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
  return entry.entry_type === JournalEntryType.PestDisease && entry.pest_status !== 'resolved';
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
  [JournalEntryType.Observation]: ['growth_update', 'experiment', 'weather_damage', 'soil_prep'],
  [JournalEntryType.Harvest]: [],
  [JournalEntryType.PestDisease]: [],
  [JournalEntryType.Milestone]: [],
  [JournalEntryType.Issue]: ['growth_update', 'experiment', 'weather_damage', 'soil_prep'],
  [JournalEntryType.Other]: ['growth_update', 'experiment', 'weather_damage', 'soil_prep'],
};

/**
 * Tags selectable for a given entry type, unioned with any legacy tags already
 * on the entry being edited (so old tags stay visible and removable).
 */
export function tagsForEntry(type: JournalEntryType, existingTags?: string[] | null): string[] {
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

// ─── Plant picker ────────────────────────────────────────────────────────────
const SPACE_LABELS: Record<SpaceType, string> = {
  pot: 'Pot',
  bed: 'Bed',
  ground: 'Ground',
};

/** Where a plant lives, for telling same-named plants apart in the picker. */
function plantPlaceLabel(plant: Plant, bedNameById: ReadonlyMap<string, string>): string {
  const bedName = (plant.bed_id ? bedNameById.get(plant.bed_id) : undefined) ?? plant.bed_name;
  if (bedName) return bedName;
  const { parent, child } = parseLocation(plant.location);
  const location = [parent, child].filter(Boolean).join(' · ');
  if (!location) return SPACE_LABELS[plant.space_type] ?? '';
  return plant.space_type === 'pot' ? `Pot · ${location}` : location;
}

/**
 * Plants the journal's "Link to plant" picker offers: pot and ground plants
 * only. Bed plants are stored per instance (a Three Sisters bed holds several
 * identical "Beans" rows), so a bed entry links to the bed instead. The
 * currently linked plant is kept even when it's a bed plant, so an older entry
 * still shows — and keeps — its link.
 */
export function journalPickablePlants(
  plants: readonly Plant[],
  selectedPlantId: string | null
): Plant[] {
  return plants.filter(
    (plant) => (!plant.bed_id && plant.space_type !== 'bed') || plant.id === selectedPlantId
  );
}

/**
 * Plant options for the journal form's "Link to plant" picker, sorted by name.
 * Each row carries its variety and bed/location as a subtitle so two plants
 * both named "Tomato" can be told apart — and found by searching a bed name.
 */
export function buildJournalPlantOptions(
  plants: readonly Plant[],
  bedNameById: ReadonlyMap<string, string>
): PickerOption[] {
  return plants
    .map((plant) => {
      const description = [plant.plant_variety, plantPlaceLabel(plant, bedNameById)]
        .filter(Boolean)
        .join(' · ');
      return {
        label: plant.name,
        value: plant.id,
        ...(description ? { description } : {}),
      };
    })
    .sort(
      (a, b) =>
        a.label.localeCompare(b.label) || (a.description ?? '').localeCompare(b.description ?? '')
    );
}

// ─── Card timestamp ──────────────────────────────────────────────────────────
const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Compact entry time for the journal card: "Today · 7:30 AM",
 * "Yesterday · 7:30 AM", "12 Sep · 7:30 AM", or "12 Sep 2025" for past years.
 */
export function formatJournalTimestamp(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(date, now)) return `Today · ${time}`;
  if (isSameDay(date, yesterday)) return `Yesterday · ${time}`;
  const dayMonth = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  if (date.getFullYear() === now.getFullYear()) return `${dayMonth} · ${time}`;
  return `${dayMonth} ${date.getFullYear()}`;
}

// ─── Pest / disease suggestions ──────────────────────────────────────────────
/**
 * Narrows the pest/disease preset groups to what the typed name matches, so
 * the suggestion block shrinks as the farmer types. An empty name shows every
 * group; an exact (case-insensitive) preset match hides the list, since the
 * name field already shows the choice.
 */
export function filterSuggestionGroups<G extends { items: string[] }>(
  groups: readonly G[],
  name: string
): G[] {
  const q = name.trim().toLowerCase();
  if (!q) return [...groups];
  if (groups.some((g) => g.items.some((item) => item.toLowerCase() === q))) return [];
  return groups
    .map((g) => ({ ...g, items: g.items.filter((item) => item.toLowerCase().includes(q)) }))
    .filter((g) => g.items.length > 0);
}

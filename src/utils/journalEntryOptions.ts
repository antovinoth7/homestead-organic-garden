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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ─── Entry types ─────────────────────────────────────────────────────────────
export interface JournalTypeOption {
  value: JournalEntryType;
  label: string;
  icon: IoniconName;
}

/**
 * Types offered for new entries, in display order — shared by the form's type
 * pills and the list's filter sheet. 'issue' and 'other' are legacy-only.
 */
export const JOURNAL_TYPE_OPTIONS: readonly JournalTypeOption[] = [
  { value: JournalEntryType.Observation, label: 'Observation', icon: 'eye' },
  { value: JournalEntryType.Harvest, label: 'Harvest', icon: 'basket' },
  { value: JournalEntryType.PestDisease, label: 'Pest/Disease', icon: 'bug' },
  { value: JournalEntryType.Milestone, label: 'Milestone', icon: 'flag' },
];

const LEGACY_TYPE_LABELS: Partial<Record<JournalEntryType, string>> = {
  [JournalEntryType.Issue]: 'Issue',
  [JournalEntryType.Other]: 'Other',
};

/** Display label for an entry type — never the raw stored value. */
export function journalTypeLabel(type: JournalEntryType): string {
  return (
    JOURNAL_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ??
    LEGACY_TYPE_LABELS[type] ??
    'Entry'
  );
}

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

/** Local midnight of a stored `YYYY-MM-DD` day, or null if it isn't one. */
function parseLocalDay(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Whole days an unresolved pest/disease problem has been open — counted from
 * the day it was observed (`pest_occurred_at`), else the day it was logged.
 * Null for anything that isn't an open problem.
 */
export function daysOpen(entry: JournalEntry, now: Date = new Date()): number | null {
  if (!isActiveProblem(entry)) return null;
  const start =
    (entry.pest_occurred_at ? parseLocalDay(entry.pest_occurred_at) : null) ??
    new Date(entry.created_at);
  if (Number.isNaN(start.getTime())) return null;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.round((today - startDay) / MS_PER_DAY));
}

/** "since today", "1 day", "6 days" — the tail of a card's "Active · …" chip. */
export function formatDaysOpen(days: number): string {
  if (days <= 0) return 'since today';
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * Re-check interval, in days, read from a reference treatment's free-text
 * `frequency` ("Every 5–7 days until infestation clears" → 5). A range takes
 * its lower bound so the reminder comes early rather than late. Null when the
 * text names no usable interval (monthly lure changes, "single release").
 */
export function recheckIntervalDays(frequency: string | null | undefined): number | null {
  if (!frequency) return null;
  const text = frequency.toLowerCase();
  const inRange = (days: number): number | null => (days >= 1 && days <= 30 ? days : null);
  const days = /every\s+(\d+)(?:\s*[–-]\s*\d+)?\s*days?\b/.exec(text);
  if (days) return inRange(Number(days[1]));
  const weeks = /every\s+(\d+)(?:\s*[–-]\s*\d+)?\s*weeks?\b/.exec(text);
  if (weeks) return inRange(Number(weeks[1]) * 7);
  if (/\bweekly\b|\bevery week\b/.test(text)) return 7;
  return null;
}

// ─── Card headline ───────────────────────────────────────────────────────────
/**
 * One-line summary built from an entry's structured fields, so a harvest or
 * pest entry saved without notes still reads as a sentence on its card:
 * "Harvested 12 pcs · Tree 3", "Aphids on leaf, fruit". Null for types whose
 * content is the notes themselves (observation) or whose type chip already
 * says it all (milestone).
 */
export function journalEntryHeadline(entry: JournalEntry): string | null {
  if (entry.entry_type === JournalEntryType.Harvest) {
    const qty = entry.harvest_quantity;
    const amount = qty
      ? `Harvested ${qty} ${normalizeHarvestUnit(entry.harvest_unit)}`
      : 'Harvested';
    return entry.harvest_tree_number ? `${amount} · Tree ${entry.harvest_tree_number}` : amount;
  }
  if (entry.entry_type === JournalEntryType.PestDisease) {
    const name = entry.pest_name?.trim() || (entry.pest_kind === 'disease' ? 'Disease' : 'Pest');
    const parts = entry.pest_affected_parts ?? [];
    return parts.length > 0 ? `${name} on ${parts.join(', ').toLowerCase()}` : name;
  }
  return null;
}

// ─── Harvest unit memory ─────────────────────────────────────────────────────
/**
 * The unit of this plant's most recent harvest, so a new harvest defaults to
 * how the farmer always measures it (coconuts in pcs, tomatoes in kg). Null
 * when the plant has no harvest yet or its last unit is no longer offered.
 */
export function lastHarvestUnit(
  entries: readonly JournalEntry[],
  plantId: string
): HarvestUnit | null {
  let latest: JournalEntry | null = null;
  for (const entry of entries) {
    if (entry.entry_type !== JournalEntryType.Harvest || entry.plant_id !== plantId) continue;
    if (!entry.harvest_unit) continue;
    if (!latest || entry.created_at > latest.created_at) latest = entry;
  }
  if (!latest) return null;
  const unit = normalizeHarvestUnit(latest.harvest_unit);
  return HARVEST_UNITS.find((u) => u === unit) ?? null;
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

// ─── Entry location (plant / bed) ────────────────────────────────────────────
type PlantRef = Pick<Plant, 'id' | 'name' | 'bed_id'>;
type BedRef = { id: string; name: string };

export type JournalLocationKind = 'plant' | 'bed';

export interface JournalLocation {
  kind: JournalLocationKind;
  label: string;
}

/**
 * What an entry's card names as its place: the linked plant, else the linked
 * bed. Null when neither resolves (deleted plant/bed, or nothing linked).
 */
export function journalEntryLocation(
  entry: JournalEntry,
  plantById: ReadonlyMap<string, PlantRef>,
  bedNameById: ReadonlyMap<string, string>
): JournalLocation | null {
  const plant = entry.plant_id ? plantById.get(entry.plant_id) : undefined;
  if (plant) return { kind: 'plant', label: plant.name };
  const bedName = entry.bed_id ? bedNameById.get(entry.bed_id) : undefined;
  return bedName ? { kind: 'bed', label: bedName } : null;
}

/** Filter-sheet value for one plant or bed: `plant:<id>` / `bed:<id>`. */
export const journalLocationKey = (kind: JournalLocationKind, id: string): string =>
  `${kind}:${id}`;

/**
 * Every location key an entry belongs to. A bed matches entries linked to the
 * bed and entries linked to a plant growing in it (older entries linked bed
 * plants directly), so filtering by "Bed 3" shows the bed's whole history.
 */
function entryLocationKeys(
  entry: JournalEntry,
  plantById: ReadonlyMap<string, PlantRef>
): string[] {
  const keys: string[] = [];
  const plant = entry.plant_id ? plantById.get(entry.plant_id) : undefined;
  if (entry.plant_id) keys.push(journalLocationKey('plant', entry.plant_id));
  const bedId = entry.bed_id || plant?.bed_id;
  if (bedId) keys.push(journalLocationKey('bed', bedId));
  return keys;
}

export function entryMatchesLocation(
  entry: JournalEntry,
  key: string,
  plantById: ReadonlyMap<string, PlantRef>
): boolean {
  return entryLocationKeys(entry, plantById).includes(key);
}

export interface JournalLocationOption extends JournalLocation {
  key: string;
}

/**
 * Plants and beds that actually have entries, for the filter sheet — beds
 * first, then pot/ground plants, each by name. Bed plants are reached through
 * their bed (mirrors the form's picker); deleted plants/beds are left out.
 */
export function collectUsedLocations(
  entries: readonly JournalEntry[],
  plantById: ReadonlyMap<string, PlantRef>,
  beds: readonly BedRef[]
): JournalLocationOption[] {
  const used = new Set<string>();
  for (const entry of entries) {
    for (const key of entryLocationKeys(entry, plantById)) used.add(key);
  }
  const byName = (a: JournalLocationOption, b: JournalLocationOption): number =>
    a.label.localeCompare(b.label);
  const bedOptions = beds
    .filter((bed) => used.has(journalLocationKey('bed', bed.id)))
    .map((bed) => ({
      key: journalLocationKey('bed', bed.id),
      kind: 'bed' as const,
      label: bed.name,
    }))
    .sort(byName);
  const plantOptions = Array.from(plantById.values())
    .filter((plant) => !plant.bed_id && used.has(journalLocationKey('plant', plant.id)))
    .map((plant) => ({
      key: journalLocationKey('plant', plant.id),
      kind: 'plant' as const,
      label: plant.name,
    }))
    .sort(byName);
  return [...bedOptions, ...plantOptions];
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

// ─── Entry date (backdating) ─────────────────────────────────────────────────
/**
 * The timestamp to store for an entry logged on `day`: that day's local date at
 * `timeSource`'s local time, never later than `now`. A new backdated entry
 * passes the current time (so entries within a day keep a natural order); an
 * edit passes the entry's original time, so moving its date keeps its hour.
 */
export function journalEntryTimestamp(day: Date, timeSource: Date, now: Date = new Date()): Date {
  const combined = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    timeSource.getMilliseconds()
  );
  return combined.getTime() > now.getTime() ? new Date(now) : combined;
}

/** Date pill label on the entry form: "Today", "Yesterday", "Mon, 22 Sep", "Fri, 3 Jan 2025". */
export function formatEntryDateLabel(date: Date, now: Date = new Date()): string {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
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

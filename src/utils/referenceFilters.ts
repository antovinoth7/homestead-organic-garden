/**
 * The pest/disease browse contract — one place that decides what the list shows,
 * what each filter chip's count means, and how the rows section themselves.
 *
 * Modelled on `plantFilters.ts`, including its `except` trick: every facet is
 * counted against the list narrowed by *every other* facet, so a chip answers
 * "how many would I get if I picked this?". That is the only reading that stays
 * true while the other facets move. A facet never filters its own options, or
 * picking one would zero the rest.
 *
 * Pure — no React, no services — so it is directly unit-testable.
 */

import type { Ionicons } from '@expo/vector-icons';
import type { RiskLevel, TreatmentEffort } from '@/types/database.types';
import type { ReferenceEntry } from '@/components/reference/types';
import { getCurrentRisk } from '@/utils/riskHelpers';

export const ALL_CATEGORIES = 'all' as const;

export type ReferenceRiskFilter = 'all' | RiskLevel;
export type ReferenceEffortFilter = 'all' | TreatmentEffort;
export type ReferenceGroupMode = 'category' | 'risk' | 'alpha';

export const DEFAULT_REFERENCE_GROUP_MODE: ReferenceGroupMode = 'category';

export interface ReferenceFilters {
  /** A category id from the registry, or `ALL_CATEGORIES`. */
  category: string;
  risk: ReferenceRiskFilter;
  effort: ReferenceEffortFilter;
}

export const EMPTY_REFERENCE_FILTERS: ReferenceFilters = {
  category: ALL_CATEGORIES,
  risk: 'all',
  effort: 'all',
};

/** A facet that can be held back — `countReferenceFacets` uses it. */
export type ReferenceFacet = keyof ReferenceFilters;

export type ReferenceListItem =
  | { kind: 'section'; title: string; count: number }
  | { kind: 'entry'; entry: ReferenceEntry };

export interface ReferenceFacetCounts {
  category: Record<string, number>;
  risk: Record<string, number>;
  effort: Record<string, number>;
  /** Everything the current search and all facets leave standing. */
  total: number;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface ReferenceOption<T extends string> {
  value: T;
  label: string;
  /** Spoken as the chip's accessibilityHint. */
  hint: string;
  icon: IoniconName;
}

export const REFERENCE_RISK_OPTIONS: readonly ReferenceOption<ReferenceRiskFilter>[] = [
  { value: 'all', label: 'Any risk', hint: 'Show every risk level', icon: 'ellipsis-horizontal' },
  { value: 'high', label: 'High now', hint: 'Show only what is high risk this season', icon: 'alert-circle' },
  { value: 'moderate', label: 'Moderate now', hint: 'Show only what is moderate risk this season', icon: 'alert' },
  { value: 'low', label: 'Low now', hint: 'Show only what is low risk this season', icon: 'shield-checkmark' },
];

export const REFERENCE_EFFORT_OPTIONS: readonly ReferenceOption<ReferenceEffortFilter>[] = [
  { value: 'all', label: 'Any effort', hint: 'Show every treatment effort', icon: 'ellipsis-horizontal' },
  { value: 'easy', label: 'Easy', hint: 'Show only what has an easy organic treatment', icon: 'leaf' },
  { value: 'moderate', label: 'Moderate', hint: 'Show only what needs a moderate treatment at best', icon: 'construct' },
  { value: 'advanced', label: 'Advanced', hint: 'Show only what needs an advanced treatment', icon: 'flask' },
];

export const REFERENCE_GROUP_MODES: readonly ReferenceOption<ReferenceGroupMode>[] = [
  { value: 'category', label: 'Category', hint: 'Group by pest or disease category', icon: 'apps' },
  { value: 'risk', label: 'Risk now', hint: 'Group by risk level this season', icon: 'thermometer' },
  { value: 'alpha', label: 'A–Z', hint: 'Group by first letter', icon: 'text' },
];

/** Ordered easiest first, so `easiestEffort` can pick a minimum. */
const EFFORT_ORDER: readonly TreatmentEffort[] = ['easy', 'moderate', 'advanced'];

/** Risk sections run worst-first — the reason to open this screen is a problem. */
const RISK_SECTION_ORDER: readonly RiskLevel[] = ['high', 'moderate', 'low'];

const RISK_SECTION_LABELS: Record<RiskLevel, string> = {
  high: 'High risk now',
  moderate: 'Moderate risk now',
  low: 'Low risk now',
};

const NO_RISK_SECTION = 'No risk this season';

/**
 * The gentlest treatment the entry offers.
 *
 * An entry carries several treatments at different efforts, so a plain
 * `some(t => t.effort === wanted)` would file the same pest under Easy *and*
 * Advanced. Reducing to the minimum makes each entry land in exactly one
 * bucket, and makes "Easy" read as "there is something easy I can do about
 * this" — which is the question the facet is there to answer.
 */
export function easiestEffort(entry: ReferenceEntry): TreatmentEffort | undefined {
  let best: TreatmentEffort | undefined;
  for (const treatment of entry.organicTreatments) {
    if (best === undefined || EFFORT_ORDER.indexOf(treatment.effort) < EFFORT_ORDER.indexOf(best)) {
      best = treatment.effort;
    }
  }
  return best;
}

/**
 * Case-insensitive substring over the fields the browse list has always
 * searched. `identification` and `damageDescription` are deliberately left out:
 * they are long prose, and including them turns almost any two-letter query
 * into a full-list match.
 */
export function matchesReferenceQuery(entry: ReferenceEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.name.toLowerCase().includes(q) ||
    (entry.tamilName?.toLowerCase().includes(q) ?? false) ||
    entry.plantsAffected.some((plant) => plant.toLowerCase().includes(q))
  );
}

/**
 * Applies the search box and every facet. `except` holds one facet back —
 * `countReferenceFacets` uses it, nothing else should need to.
 *
 * `date` and the zone are left to `getCurrentRisk`'s own defaults in the app;
 * tests pass a fixed date so a season boundary cannot make them flap.
 */
export function filterReferenceEntries(
  entries: readonly ReferenceEntry[],
  query: string,
  filters: ReferenceFilters,
  except?: ReferenceFacet,
  date?: Date
): ReferenceEntry[] {
  return entries.filter((entry) => {
    if (!matchesReferenceQuery(entry, query)) return false;
    if (
      except !== 'category' &&
      filters.category !== ALL_CATEGORIES &&
      entry.category !== filters.category
    ) {
      return false;
    }
    if (except !== 'risk' && filters.risk !== 'all') {
      if (getCurrentRisk(entry.seasonalRisk, date) !== filters.risk) return false;
    }
    if (except !== 'effort' && filters.effort !== 'all') {
      if (easiestEffort(entry) !== filters.effort) return false;
    }
    return true;
  });
}

function tally<T extends string>(
  entries: readonly ReferenceEntry[],
  valueOf: (entry: ReferenceEntry) => T | null | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const value = valueOf(entry);
    if (value) counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

/**
 * How many entries each chip would yield, given the others. Every facet is
 * counted against the list narrowed by everything but itself; the `all` option
 * of each facet gets that same list's length, since choosing it drops only that
 * facet's own constraint.
 */
export function countReferenceFacets(
  entries: readonly ReferenceEntry[],
  query: string,
  filters: ReferenceFilters,
  date?: Date
): ReferenceFacetCounts {
  const byCategory = filterReferenceEntries(entries, query, filters, 'category', date);
  const byRisk = filterReferenceEntries(entries, query, filters, 'risk', date);
  const byEffort = filterReferenceEntries(entries, query, filters, 'effort', date);

  return {
    category: { ...tally(byCategory, (e) => e.category), [ALL_CATEGORIES]: byCategory.length },
    risk: { ...tally(byRisk, (e) => getCurrentRisk(e.seasonalRisk, date)), all: byRisk.length },
    effort: { ...tally(byEffort, easiestEffort), all: byEffort.length },
    total: filterReferenceEntries(entries, query, filters, undefined, date).length,
  };
}

/** How many facets are narrowing the list — drives the funnel's badge. */
export function countActiveReferenceFilters(
  filters: ReferenceFilters,
  mode: ReferenceGroupMode
): number {
  const facets = (Object.keys(EMPTY_REFERENCE_FILTERS) as ReferenceFacet[]).filter(
    (key) => filters[key] !== EMPTY_REFERENCE_FILTERS[key]
  ).length;
  return facets + (mode === DEFAULT_REFERENCE_GROUP_MODE ? 0 : 1);
}

/** Appends a section and its rows, A–Z within the section. */
function pushSection(
  items: ReferenceListItem[],
  title: string,
  entries: readonly ReferenceEntry[]
): void {
  if (entries.length === 0) return;
  items.push({ kind: 'section', title, count: entries.length });
  for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
    items.push({ kind: 'entry', entry });
  }
}

/**
 * Flattens entries into section headers and rows for a plain `FlatList`.
 *
 * `categoryLabels` carries the registry's canonical category order as well as
 * its labels, so Sap-Sucking leads the list here exactly as it does in
 * `getGroupedPestEntries` — sorting the section titles alphabetically instead
 * would silently reorder the screen.
 */
export function buildReferenceItems(
  entries: readonly ReferenceEntry[],
  mode: ReferenceGroupMode,
  categoryLabels: ReadonlyMap<string, string>,
  date?: Date
): ReferenceListItem[] {
  const items: ReferenceListItem[] = [];

  if (mode === 'alpha') {
    const byLetter = new Map<string, ReferenceEntry[]>();
    for (const entry of entries) {
      const first = entry.name.trim().charAt(0).toUpperCase();
      // Anything that is not A–Z collects under a single `#`, the way the
      // plant catalog buckets its own strays.
      const letter = first >= 'A' && first <= 'Z' ? first : '#';
      const bucket = byLetter.get(letter) ?? [];
      bucket.push(entry);
      byLetter.set(letter, bucket);
    }
    for (const letter of [...byLetter.keys()].sort()) {
      pushSection(items, letter, byLetter.get(letter) ?? []);
    }
    return items;
  }

  if (mode === 'risk') {
    for (const level of RISK_SECTION_ORDER) {
      pushSection(
        items,
        RISK_SECTION_LABELS[level],
        entries.filter((entry) => getCurrentRisk(entry.seasonalRisk, date) === level)
      );
    }
    pushSection(
      items,
      NO_RISK_SECTION,
      entries.filter((entry) => getCurrentRisk(entry.seasonalRisk, date) === undefined)
    );
    return items;
  }

  for (const [category, label] of categoryLabels) {
    pushSection(
      items,
      label,
      entries.filter((entry) => entry.category === category)
    );
  }
  // A category the label map has never heard of would otherwise vanish from the
  // list rather than merely losing its heading.
  pushSection(
    items,
    'Other',
    entries.filter((entry) => !categoryLabels.has(entry.category))
  );
  return items;
}

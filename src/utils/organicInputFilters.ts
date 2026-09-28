/**
 * The organic-input browse contract — the sibling of `referenceFilters.ts`,
 * narrower because `OrganicInputEntry` carries no seasonal risk and no
 * treatment effort to facet on.
 *
 * It stays a separate module rather than a generic over both entry types: the
 * two share a shape (id, name, tamilName, category) but nothing else, and a
 * shared generic would have to be parameterised on the search fields, the
 * facets and the group modes all at once — every call site passing three
 * callbacks to save one file.
 *
 * Pure — no React, no services — so it is directly unit-testable.
 */

import type { Ionicons } from '@expo/vector-icons';
import type { OrganicInputEntry } from '@/types/database.types';

export const ALL_CATEGORIES = 'all' as const;

/** Whether the input has a recipe you can make at home. */
export type OrganicInputDiyFilter = 'all' | 'yes' | 'no';
export type OrganicInputGroupMode = 'category' | 'alpha';

export const DEFAULT_ORGANIC_INPUT_GROUP_MODE: OrganicInputGroupMode = 'category';

export interface OrganicInputFilters {
  category: string;
  diy: OrganicInputDiyFilter;
}

export const EMPTY_ORGANIC_INPUT_FILTERS: OrganicInputFilters = {
  category: ALL_CATEGORIES,
  diy: 'all',
};

export type OrganicInputFacet = keyof OrganicInputFilters;

export type OrganicInputListItem =
  | { kind: 'section'; title: string; count: number }
  | { kind: 'entry'; entry: OrganicInputEntry };

export interface OrganicInputFacetCounts {
  category: Record<string, number>;
  diy: Record<string, number>;
  total: number;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface OrganicInputOption<T extends string> {
  value: T;
  label: string;
  hint: string;
  icon: IoniconName;
}

export const ORGANIC_INPUT_DIY_OPTIONS: readonly OrganicInputOption<OrganicInputDiyFilter>[] = [
  { value: 'all', label: 'Any', hint: 'Show both homemade and bought inputs', icon: 'ellipsis-horizontal' },
  { value: 'yes', label: 'Make at home', hint: 'Show only inputs with a recipe', icon: 'flask' },
  { value: 'no', label: 'Buy ready-made', hint: 'Show only inputs without a recipe', icon: 'cart' },
];

export const ORGANIC_INPUT_GROUP_MODES: readonly OrganicInputOption<OrganicInputGroupMode>[] = [
  { value: 'category', label: 'Category', hint: 'Group by input category', icon: 'apps' },
  { value: 'alpha', label: 'A–Z', hint: 'Group by first letter', icon: 'text' },
];

/**
 * Case-insensitive substring over the fields the input list has always
 * searched. `description` is short enough here to stay useful, unlike the prose
 * fields on a pest entry.
 */
export function matchesOrganicInputQuery(entry: OrganicInputEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    entry.name.toLowerCase().includes(q) ||
    (entry.tamilName?.toLowerCase().includes(q) ?? false) ||
    entry.description.toLowerCase().includes(q) ||
    entry.plantsIdeal.some((plant) => plant.toLowerCase().includes(q))
  );
}

/** The DIY bucket an entry counts towards — the same field the card badges. */
export function diyBucketOf(entry: OrganicInputEntry): 'yes' | 'no' {
  return entry.recipeId ? 'yes' : 'no';
}

/**
 * Applies the search box and every facet. `except` holds one facet back —
 * `countOrganicInputFacets` uses it, nothing else should need to.
 */
export function filterOrganicInputs(
  entries: readonly OrganicInputEntry[],
  query: string,
  filters: OrganicInputFilters,
  except?: OrganicInputFacet
): OrganicInputEntry[] {
  return entries.filter((entry) => {
    if (!matchesOrganicInputQuery(entry, query)) return false;
    if (
      except !== 'category' &&
      filters.category !== ALL_CATEGORIES &&
      entry.category !== filters.category
    ) {
      return false;
    }
    if (except !== 'diy' && filters.diy !== 'all' && diyBucketOf(entry) !== filters.diy) {
      return false;
    }
    return true;
  });
}

function tally<T extends string>(
  entries: readonly OrganicInputEntry[],
  valueOf: (entry: OrganicInputEntry) => T | null | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of entries) {
    const value = valueOf(entry);
    if (value) counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

/**
 * How many entries each chip would yield, given the others — each facet counted
 * against the list narrowed by everything but itself.
 */
export function countOrganicInputFacets(
  entries: readonly OrganicInputEntry[],
  query: string,
  filters: OrganicInputFilters
): OrganicInputFacetCounts {
  const byCategory = filterOrganicInputs(entries, query, filters, 'category');
  const byDiy = filterOrganicInputs(entries, query, filters, 'diy');

  return {
    category: { ...tally(byCategory, (e) => e.category), [ALL_CATEGORIES]: byCategory.length },
    diy: { ...tally(byDiy, diyBucketOf), all: byDiy.length },
    total: filterOrganicInputs(entries, query, filters).length,
  };
}

/** How many facets are narrowing the list — drives the funnel's badge. */
export function countActiveOrganicInputFilters(
  filters: OrganicInputFilters,
  mode: OrganicInputGroupMode
): number {
  const facets = (Object.keys(EMPTY_ORGANIC_INPUT_FILTERS) as OrganicInputFacet[]).filter(
    (key) => filters[key] !== EMPTY_ORGANIC_INPUT_FILTERS[key]
  ).length;
  return facets + (mode === DEFAULT_ORGANIC_INPUT_GROUP_MODE ? 0 : 1);
}

function pushSection(
  items: OrganicInputListItem[],
  title: string,
  entries: readonly OrganicInputEntry[]
): void {
  if (entries.length === 0) return;
  items.push({ kind: 'section', title, count: entries.length });
  for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
    items.push({ kind: 'entry', entry });
  }
}

/**
 * Flattens entries into section headers and rows. `categoryLabels` carries the
 * registry's canonical order as well as its labels, so the sections appear in
 * the order `getGroupedOrganicInputs` declares rather than alphabetically.
 */
export function buildOrganicInputItems(
  entries: readonly OrganicInputEntry[],
  mode: OrganicInputGroupMode,
  categoryLabels: ReadonlyMap<string, string>
): OrganicInputListItem[] {
  const items: OrganicInputListItem[] = [];

  if (mode === 'alpha') {
    const byLetter = new Map<string, OrganicInputEntry[]>();
    for (const entry of entries) {
      const first = entry.name.trim().charAt(0).toUpperCase();
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

  for (const [category, label] of categoryLabels) {
    pushSection(
      items,
      label,
      entries.filter((entry) => entry.category === category)
    );
  }
  pushSection(
    items,
    'Other',
    entries.filter((entry) => !categoryLabels.has(entry.category))
  );
  return items;
}

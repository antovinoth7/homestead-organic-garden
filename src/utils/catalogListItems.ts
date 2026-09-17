import { catalogRowTotalHeight, catalogSectionHeaderHeight } from '@/styles/catalogMetrics';
import { SUB_GROUP_ORDER } from '@/config/plants/catalogTaxonomy';
import {
  LIFECYCLE_SECTION_LABELS,
  LIFECYCLE_SECTION_ORDER,
  SUB_GROUP_LABELS,
} from '@/utils/plantLabels';
import { comparePlantNames, plantNameSectionLetter } from '@/utils/plantSort';
import type { CatalogSearchResult } from '@/utils/catalogSearch';
import type {
  CatalogGroup,
  PlantHabit,
  PlantLifecycle,
  PlantType,
} from '@/types/database.types';

/** How the browse list sections itself. Driven by the header's mode toggle. */
export type CatalogGroupMode = 'type' | 'season' | 'alpha';

/**
 * The sub-group that holds whatever a group's named sub-groups do not. Some
 * groups declare it in `SUB_GROUP_ORDER` and some do not, which is why the
 * leftovers have to be folded in rather than always appended.
 */
const OTHER_SUB_GROUP = 'other';

/**
 * One plant as the browse list needs it. Assembled by `usePlantCatalogManager`,
 * which resolves the taxonomy and lifecycle once per plant rather than per mode.
 */
export interface CatalogBrowseEntry {
  name: string;
  /** Shown beside the English name, as the pest/disease list already does. */
  tamilName?: string;
  /**
   * The plant's own care model. A browse group spans several — Fruits holds both
   * `fruit_tree` trees and herbaceous quick fruits — so the row cannot inherit
   * this from the active tab the way it used to.
   */
  plantType: PlantType;
  /** Sub-group id, absent for a group that renders as one run or a user-added plant. */
  subGroup?: string;
  habit: PlantHabit;
  lifecycle: PlantLifecycle;
  /** Garden plants currently using this entry. */
  count: number;
  subtitle?: string;
}

export type CatalogListItem =
  | { kind: 'section'; title: string; count: number }
  /**
   * `isFirst`/`isLast` are per section, not per list: each section renders as its
   * own rounded card, so a row cannot derive them from its index.
   */
  | {
      kind: 'browse';
      name: string;
      tamilName?: string;
      plantType: PlantType;
      habit: PlantHabit;
      count: number;
      subtitle?: string;
      isFirst: boolean;
      isLast: boolean;
    }
  | { kind: 'result'; result: CatalogSearchResult };

export interface CatalogListLayout {
  items: CatalogListItem[];
  /** Height of each item, parallel to `items`. */
  heights: number[];
  /** Cumulative pixel offset of each item — what getItemLayout reports. */
  offsets: number[];
}

interface BrowseInput {
  group: CatalogGroup;
  entries: readonly CatalogBrowseEntry[];
  mode: CatalogGroupMode;
}

/** Emits one section header and its rows, sorted A–Z within the section. */
function pushSection(
  items: CatalogListItem[],
  title: string,
  members: readonly CatalogBrowseEntry[]
): void {
  if (members.length === 0) return;
  items.push({ kind: 'section', title, count: members.length });
  const sorted = [...members].sort((a, b) => comparePlantNames(a.name, b.name));
  sorted.forEach((entry, index) => {
    items.push({
      kind: 'browse',
      name: entry.name,
      tamilName: entry.tamilName,
      plantType: entry.plantType,
      habit: entry.habit,
      count: entry.count,
      subtitle: entry.subtitle,
      isFirst: index === 0,
      isLast: index === sorted.length - 1,
    });
  });
}

/**
 * Builds the browse list under one of three groupings.
 *
 * `type` is the default and the reason the catalog was regrouped: a farmer looks
 * for "gourds" or "keerai", not for the letter G. `season` answers the other
 * question a bed plan turns on — what gets resown each season versus what stays
 * in the ground. `alpha` is the original A–Z, kept for when you already know the
 * name; search covers that case better, which is why it is no longer the default.
 */
export function buildBrowseItems({ group, entries, mode }: BrowseInput): CatalogListItem[] {
  const items: CatalogListItem[] = [];

  if (mode === 'alpha') {
    const sorted = [...entries].sort((a, b) => comparePlantNames(a.name, b.name));
    let index = 0;
    while (index < sorted.length) {
      const letter = plantNameSectionLetter(sorted[index]!.name);
      let end = index;
      while (end < sorted.length && plantNameSectionLetter(sorted[end]!.name) === letter) {
        end += 1;
      }
      pushSection(items, letter, sorted.slice(index, end));
      index = end;
    }
    return items;
  }

  if (mode === 'season') {
    for (const lifecycle of LIFECYCLE_SECTION_ORDER) {
      pushSection(
        items,
        LIFECYCLE_SECTION_LABELS[lifecycle],
        entries.filter((entry) => entry.lifecycle === lifecycle)
      );
    }
    return items;
  }

  // `type`: walk the group's declared sub-group order so the sections read in a
  // deliberate sequence rather than however the data happened to be written.
  const declared = SUB_GROUP_ORDER[group];
  if (declared.length === 0) {
    pushSection(items, SUB_GROUP_LABELS.other ?? 'Other', entries);
    return items;
  }

  // A plant with no sub-group — every user-added one — belongs with whatever the
  // group files under `other`. Vegetables *declares* `other` and Drumstick sits
  // in it, so emitting the leftovers as their own section gave that group two
  // "Other" headers with the same FlatList key the moment a user added a plant.
  const isLeftover = (entry: CatalogBrowseEntry): boolean =>
    !entry.subGroup || !declared.includes(entry.subGroup);

  for (const subGroup of declared) {
    const members =
      subGroup === OTHER_SUB_GROUP
        ? entries.filter((entry) => entry.subGroup === subGroup || isLeftover(entry))
        : entries.filter((entry) => entry.subGroup === subGroup);
    pushSection(items, SUB_GROUP_LABELS[subGroup] ?? subGroup, members);
  }

  // Only groups that do not declare `other` still need a trailing catch-all.
  if (!declared.includes(OTHER_SUB_GROUP)) {
    pushSection(items, SUB_GROUP_LABELS.other ?? 'Other', entries.filter(isLeftover));
  }
  return items;
}

/** Search results keep their relevance ranking, so they get no sections. */
export function buildSearchItems(results: readonly CatalogSearchResult[]): CatalogListItem[] {
  return results.map((result) => ({ kind: 'result' as const, result }));
}

/**
 * Measures a browse list for `getItemLayout`. Browse items come in two fixed
 * heights — rows and section headers — so a single multiplication does not work
 * and the screen indexes into this table instead. Identical for all three modes.
 */
export function measureCatalogItems(
  items: CatalogListItem[],
  fontScale = 1
): CatalogListLayout {
  // Resolved once rather than per item: both heights are pure functions of the
  // scale, and a list of 200 plants would otherwise recompute them 200 times.
  const rowHeight = catalogRowTotalHeight(fontScale);
  const headerHeight = catalogSectionHeaderHeight(fontScale);

  const heights = items.map((item) =>
    item.kind === 'section' ? headerHeight : rowHeight
  );

  const offsets: number[] = [];
  let running = 0;
  for (const height of heights) {
    offsets.push(running);
    running += height;
  }

  return { items, heights, offsets };
}

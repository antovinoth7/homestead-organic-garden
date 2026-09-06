import {
  CATALOG_ROW_TOTAL_HEIGHT,
  CATALOG_SECTION_HEADER_HEIGHT,
} from '@/styles/catalogMetrics';
import { buildCatalogSubtitle } from '@/utils/catalogSummaries';
import { plantNameSectionLetter } from '@/utils/plantSort';
import type { CatalogSearchResult } from '@/utils/catalogSearch';
import type { PlantProfile } from '@/types/database.types';

export type CatalogListItem =
  | { kind: 'section'; letter: string; count: number }
  /**
   * `isFirst`/`isLast` are per letter group, not per list: each group renders as
   * its own rounded card, so a row cannot derive them from its index.
   */
  | {
      kind: 'browse';
      name: string;
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
  /** Already sorted A–Z by `getPlantNamesForType`. */
  plantNames: readonly string[];
  /** Garden-plant counts keyed by plant name. */
  counts: Record<string, number>;
  /** Merged profiles for the active category, for the row subtitle. */
  profilesForType: Record<string, PlantProfile>;
}

/**
 * Browse list: an A–Z header before each letter's run of plants.
 *
 * Relies on `plantNames` arriving sorted, which makes each letter's run
 * contiguous and the grouping a single pass.
 */
export function buildBrowseItems({
  plantNames,
  counts,
  profilesForType,
}: BrowseInput): CatalogListItem[] {
  const items: CatalogListItem[] = [];
  let index = 0;

  while (index < plantNames.length) {
    const letter = plantNameSectionLetter(plantNames[index]!);

    let end = index;
    while (end < plantNames.length && plantNameSectionLetter(plantNames[end]!) === letter) {
      end += 1;
    }

    items.push({ kind: 'section', letter, count: end - index });

    for (let i = index; i < end; i += 1) {
      const name = plantNames[i]!;
      const entry = profilesForType[name];
      items.push({
        kind: 'browse',
        name,
        count: counts[name] ?? 0,
        subtitle: buildCatalogSubtitle(entry?.description, entry?.varieties?.length ?? 0),
        isFirst: i === index,
        isLast: i === end - 1,
      });
    }

    index = end;
  }

  return items;
}

/** Search results keep their relevance ranking, so they get no letter groups. */
export function buildSearchItems(results: readonly CatalogSearchResult[]): CatalogListItem[] {
  return results.map((result) => ({ kind: 'result' as const, result }));
}

/**
 * Measures a browse list for `getItemLayout`. Browse items come in two fixed
 * heights — rows and letter headers — so a single multiplication no longer
 * works and the screen indexes into this table instead.
 */
export function measureCatalogItems(items: CatalogListItem[]): CatalogListLayout {
  const heights = items.map((item) =>
    item.kind === 'section' ? CATALOG_SECTION_HEADER_HEIGHT : CATALOG_ROW_TOTAL_HEIGHT
  );

  const offsets: number[] = [];
  let running = 0;
  for (const height of heights) {
    offsets.push(running);
    running += height;
  }

  return { items, heights, offsets };
}

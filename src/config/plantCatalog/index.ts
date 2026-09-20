import type { PlantCatalogEntry } from './types';
import { VEGETABLE_ENTRIES } from './entries/vegetables';
import { HERB_ENTRIES } from './entries/herbs';
import { FLOWER_ENTRIES } from './entries/flowers';
import { FRUIT_TREE_ENTRIES } from './entries/fruitTrees';
import { TIMBER_TREE_ENTRIES } from './entries/timberTrees';
import { COCONUT_TREE_ENTRIES } from './entries/coconutTrees';
import { SHRUB_ENTRIES } from './entries/shrubs';
import { SPINACH_ENTRIES } from './entries/spinach';

/**
 * Every bundled catalog row, sharded by category only to keep the files small.
 *
 * The concatenation order is the order the old `DEFAULT_PLANT_CATALOG` literal
 * declared its categories, and `buildPlantCatalog` keys the result by first
 * appearance — so the derived object comes out with the same key order the
 * hand-written one had.
 */
export const PLANT_CATALOG_ENTRIES: readonly PlantCatalogEntry[] = [
  ...VEGETABLE_ENTRIES,
  ...HERB_ENTRIES,
  ...FLOWER_ENTRIES,
  ...FRUIT_TREE_ENTRIES,
  ...TIMBER_TREE_ENTRIES,
  ...COCONUT_TREE_ENTRIES,
  ...SHRUB_ENTRIES,
  ...SPINACH_ENTRIES,
];

export type { PlantCatalogEntry } from './types';
export { buildPlantCatalog, buildVarietiesByType } from './derive';

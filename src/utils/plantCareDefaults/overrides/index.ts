import { PlantCareProfile } from '@/types/database.types';

import { BED_VEGETABLE_OVERRIDES } from './bedVegetables';
import { FLOWER_OVERRIDES } from './flowers';
import { FRUIT_TREE_OVERRIDES } from './fruitTrees';
import { HERB_OVERRIDES } from './herbs';
import { HERB_SPICE_OVERRIDES } from './herbsSpices';
import { INTERCROP_FRUIT_TREE_OVERRIDES } from './intercropFruitTrees';
import { NEW_SHRUB_OVERRIDES } from './newShrubs';
import { TIMBER_COCONUT_SHRUB_OVERRIDES } from './timberCoconutShrubs';
import { VEGETABLE_OVERRIDES_1 } from './vegetables1';
import { VEGETABLE_OVERRIDES_2 } from './vegetables2';

// Merge order mirrors the original monolith's literal order — later sections
// intentionally win duplicate keys (e.g. 'vegetable:Ladies Finger' appears in
// both Vegetables and New Vegetable Bed Plants; the bed-plants entry applies).
export const PLANT_CARE_OVERRIDES: Record<string, PlantCareProfile> = {
  ...VEGETABLE_OVERRIDES_1,
  ...VEGETABLE_OVERRIDES_2,
  ...HERB_OVERRIDES,
  ...FLOWER_OVERRIDES,
  ...FRUIT_TREE_OVERRIDES,
  ...TIMBER_COCONUT_SHRUB_OVERRIDES,
  ...BED_VEGETABLE_OVERRIDES,
  ...HERB_SPICE_OVERRIDES,
  ...NEW_SHRUB_OVERRIDES,
  ...INTERCROP_FRUIT_TREE_OVERRIDES,
};

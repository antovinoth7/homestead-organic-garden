import { PlantType } from '@/types/database.types';

/**
 * The one order the eight categories are presented in.
 *
 * `plantCatalog.ts` and `plantLabels.ts` each used to keep their own list, and
 * they had drifted: the catalog's put `spinach` last, so Greens was the tab you
 * had to scroll furthest to reach, while the labels' put it third. Keerai is a
 * daily homestead crop, so third — right after the vegetables and the fruit
 * trees — is the order that survived.
 *
 * This lives in its own leaf module rather than in either of those files so
 * that neither has to import the other, and so the order has one home. (Not an
 * AsyncStorage constraint: `tsx` loads `@/lib/storage` and the `@/` alias
 * fine. Only `@/lib/firebase` and Metro-only asset requires fail under it.)
 */
export const PLANT_CATEGORIES: PlantType[] = [
  'vegetable',
  'fruit_tree',
  'spinach',
  'coconut_tree',
  'herb',
  'timber_tree',
  'flower',
  'shrub',
];

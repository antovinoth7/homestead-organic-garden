import type { Ionicons } from '@expo/vector-icons';
import type { CatalogGroupMode } from '@/utils/catalogListItems';

/** The grouping the catalog opens on — the funnel badge counts any departure from it. */
export const DEFAULT_CATALOG_GROUP_MODE: CatalogGroupMode = 'type';

/**
 * Three questions a farmer actually asks of a plant list: what kind is it
 * (Type — gourds, keerai, tubers), how long it stays (Lifespan — sown each
 * year or left in the ground), and where is the name (A–Z). Type leads because
 * nobody looks up a crop by its English initial; A–Z stays because sometimes you
 * do know the name, though search serves that better.
 */
export const CATALOG_GROUP_MODES: readonly {
  value: CatalogGroupMode;
  label: string;
  hint: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  { value: 'type', label: 'Type', hint: 'Group by kind of crop', icon: 'apps-outline' },
  {
    value: 'season',
    // Not "Season": here that reads as a sowing season (pattam), and this
    // groups by how long the plant lives.
    label: 'Lifespan',
    hint: 'Group by annual, perennial or permanent',
    icon: 'calendar-outline',
  },
  { value: 'alpha', label: 'A–Z', hint: 'Group by first letter', icon: 'text-outline' },
];

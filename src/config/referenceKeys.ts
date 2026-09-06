/**
 * Key derivation for bundled reference images — kept separate from
 * `referenceAssets.ts` so Node tooling (scripts/reference/) can import it
 * without pulling in `referenceImages.gen.ts`, whose `require('*.webp')`
 * calls only resolve under Metro.
 */
import { getCanonicalPlantKey } from '../utils/plantAliases';


/** Converts a display name to a stable asset key: "Aloe Vera" → "aloe_vera". */
export function slugifyReferenceKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Plant names that are the same crop under another name share one image.
 * Keys and values are slugified plant names; the value is the canonical
 * slug an image file is stored under.
 */
export const PLANT_IMAGE_ALIASES: Record<string, string> = {
  lime: 'lemon',
  maize: 'corn',
  amaranth: 'amaranthus',
  amaranth_greens: 'amaranthus',
  palak: 'spinach',
};

/**
 * Reference-image coverage for names that are not rows in the visible plant
 * catalog: tropical fruit and timber species kept for their photos, and the
 * alias spellings whose slug is the canonical asset key (Palak's image lives
 * under `spinach`, Maize's under `corn`). These resolve through the same
 * slug-based asset map without adding anything to the catalog.
 */
export const EXTRA_REFERENCE_PLANT_NAMES = [
  // Alias spellings and reference-only names that carry a bundled image of
  // their own. They were catalog rows in the emoji map `getKnownPlantNames()`
  // used to read; they stay known here so the WebPs are not orphaned and so
  // both sides of every PLANT_IMAGE_ALIASES pair resolve to a known name.
  'Amaranth',
  'Apple',
  'Broccoli',
  'Coconut',
  'Comfrey',
  'Corn',
  'Grape',
  'Lime',
  'Spinach',
  'Tulip',
  // Removed from the catalog in the Tamil Nadu relevance pass (Sep 2026) but
  // their photos stay bundled: Coleus, and the Mediterranean herbs and
  // glasshouse flowers that are not Tamil Nadu homestead plants.
  'Coleus',
  'Parsley',
  'Rosemary',
  'Thyme',
  'Oregano',
  'Sage',
  'Lettuce',
  'Squash',
  'Strawberry',
  'Cauliflower',
  'Taro',
  'Sweet Potato',
  'Turnip',
  'Knol Khol',
  'Green Peas',
  'Lablab Bean',
  'Winged Bean',
  'Sword Bean',
  'Muskmelon',
  'Palak',
  'Malabar Spinach',
  'Water Spinach',
  'Amaranth Greens',
  'Ponnanganni Keerai',
  'Manathakkali Keerai',
  'Mustard Greens',
  'Vallarai Keerai',
  'Chrysanthemum',
  'Crossandra',
  'Ixora',
  'Dahlia',
  'Orchid',
  'Lily',
  'Jackfruit',
  'Chikoo',
  'Water Apple',
  'Custard Apple',
  'Amla',
  'Soursop',
  'Mangosteen',
  'Rambutan',
  'Red Banana',
  'Breadfruit',
  'Passion Fruit',
  'Star Fruit',
  'Fig',
  'Lychee',
  'Batoko Plum',
  'Citron',
  'Cashew Nut',
  'Neem',
  'Teak',
  'Mahogany',
  'Rosewood',
  'Sandalwood',
  'Wild Jack',
  'Dwarf Coconut',
  'Tall Coconut',
  'Hybrid Coconut',
  'King Coconut',
] as const;

/** Combines catalog-provided names with curated reference-image-only names. */
export function getKnownReferencePlantNames(catalogNames: readonly string[]): string[] {
  return [...new Set([...catalogNames, ...EXTRA_REFERENCE_PLANT_NAMES])];
}

/**
 * Resolves a plant name to the canonical asset key used in PLANT_IMAGES.
 *
 * Name aliases run first so a renamed-away entry (Methi, Eggplant) lands on
 * its canonical crop, then PLANT_IMAGE_ALIASES folds in the names that are a
 * distinct plant but share a photo.
 */
export function resolvePlantImageKey(plantName: string): string {
  const slug = slugifyReferenceKey(getCanonicalPlantKey(plantName) ?? plantName);
  return PLANT_IMAGE_ALIASES[slug] ?? slug;
}

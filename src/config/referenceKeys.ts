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
  pepper: 'chilli',
  lime: 'lemon',
  maize: 'corn',
  amaranth: 'amaranthus',
  green_peas: 'peas',
  amaranth_greens: 'amaranthus',
  palak: 'spinach',
};

/**
 * Curated image-prompt coverage for catalog plants that have no emoji-map
 * entry yet, plus reference-only tropical fruit trees. These names resolve
 * through the same slug-based asset map as catalog plants without changing
 * the visible plant catalog.
 */
export const EXTRA_REFERENCE_PLANT_NAMES = [
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

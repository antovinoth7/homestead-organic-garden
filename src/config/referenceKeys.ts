/**
 * Key derivation for bundled reference images — kept separate from
 * `referenceAssets.ts` so Node tooling (scripts/reference/) can import it
 * without pulling in `referenceImages.gen.ts`, whose `require('*.webp')`
 * calls only resolve under Metro.
 */

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
  eggplant: 'brinjal',
  long_brinjal: 'brinjal',
  pepper: 'chilli',
  lime: 'lemon',
  maize: 'corn',
  amaranth: 'amaranthus',
  methi: 'fenugreek',
  moringa: 'drumstick',
};

/**
 * Curated image-prompt coverage for catalog plants that have no emoji-map
 * entry yet, plus reference-only tropical fruit trees. These names resolve
 * through the same slug-based asset map as catalog plants without changing
 * the visible plant catalog.
 */
export const EXTRA_REFERENCE_PLANT_NAMES = [
  'Cauliflower',
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

/** Resolves a plant name to the canonical asset key used in PLANT_IMAGES. */
export function resolvePlantImageKey(plantName: string): string {
  const slug = slugifyReferenceKey(plantName);
  return PLANT_IMAGE_ALIASES[slug] ?? slug;
}

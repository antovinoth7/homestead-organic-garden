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

/** Resolves a plant name to the canonical asset key used in PLANT_IMAGES. */
export function resolvePlantImageKey(plantName: string): string {
  const slug = slugifyReferenceKey(plantName);
  return PLANT_IMAGE_ALIASES[slug] ?? slug;
}

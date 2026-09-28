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
  // Catalog rows whose photo is filed under another slug. Spelling variants
  // (Lime, Amaranth, Long Brinjal…) need no entry here: the name aliases fold
  // them onto their catalog row before this lookup runs.
  maize: 'corn',
  palak: 'spinach',
  cashew: 'cashew_nut',
};

/**
 * The canonical image slot for a catalog row whose photo is filed under
 * another name: Maize's lives under `corn`, Cashew's under `cashew_nut`,
 * Palak's under `spinach`. Listing the slot's own name keeps it known to the
 * manifest (so its prompt is generated) and to the asset-integrity test.
 *
 * Every other plant image is a catalog row's own. Images for plants the
 * catalog no longer offers — the Mediterranean herbs, glasshouse flowers and
 * rows merged into another (Long Brinjal, French Beans, Red Banana, Yardlong
 * Beans, the four coconut types) — were removed rather than bundled unused;
 * their names resolve to the surviving row's photo through the aliases.
 */
export const EXTRA_REFERENCE_PLANT_NAMES = ['Corn', 'Cashew Nut', 'Spinach'] as const;

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

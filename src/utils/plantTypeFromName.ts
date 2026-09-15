import { DEFAULT_PLANT_CATALOG, PLANT_CATEGORIES } from '@/services/plantCatalog';
import { getCanonicalPlantKey, toLookupKey } from '@/utils/plantAliases';
import type { PlantType } from '@/types/database.types';

// Reverse index: canonical catalog lookup key → PlantType
const CATALOG_INDEX = new Map<string, PlantType>();
for (const category of PLANT_CATEGORIES) {
  const plants = DEFAULT_PLANT_CATALOG.categories[category]?.plants ?? [];
  for (const name of plants) {
    const key = getCanonicalPlantKey(name);
    if (key) CATALOG_INDEX.set(key, category);
  }
}

/**
 * Names that are not catalog plants and so cannot go in `PLANT_NAME_ALIASES`,
 * which requires its canonical side to be a real catalog entry.
 *
 * Every one is a guild-template or accumulator row spelling. They stay because
 * the templates use them verbatim; `PLANT_NAME_ALIASES` handles everything that
 * *does* have a catalog entry, so "Okra" and "Methi" are not listed here.
 * `Spinach` is deliberately separate from Palak — they are different plants that
 * only share a reference photo, which is why `plantAliases` excludes the pair.
 */
const NAME_TYPE_ALIASES: Record<string, PlantType> = {
  amaranth: 'spinach', // template row; catalog has "Amaranthus"
  spinach: 'spinach', // companion/row name; a different plant from Palak
  'black gram (urad)': 'vegetable', // template row includes parenthetical
  'pigeon pea (arhar)': 'vegetable', // template row includes parenthetical
  comfrey: 'herb', // dynamic accumulator; not in the catalog
};

/**
 * Resolve PlantType for a name without falling back to 'vegetable'.
 * Returns null when the name has no catalog or alias match — callers can
 * detect a true miss vs. the legitimate vegetable category.
 *
 * Resolves through `PLANT_NAME_ALIASES` first, so every spelling the rest of the
 * app accepts answers here too rather than needing a second alias table.
 */
export function resolvePlantType(name: string): PlantType | null {
  const raw = toLookupKey(name);
  if (!raw) return null;
  const alias = NAME_TYPE_ALIASES[raw];
  if (alias !== undefined) return alias;
  const key = getCanonicalPlantKey(name);
  if (!key) return null;
  return CATALOG_INDEX.get(key) ?? null;
}

/**
 * Look up the PlantType for a plant name. Falls back to 'vegetable' when no
 * catalog or alias match is found. Used when turning wizard PlantEntry
 * placeholders into real Plant records.
 */
export function plantTypeFromName(name: string): PlantType {
  return resolvePlantType(name) ?? 'vegetable';
}

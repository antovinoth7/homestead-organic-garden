import { DEFAULT_PLANT_CATALOG, PLANT_CATEGORIES } from '@/services/plantCatalog';
import type { PlantType } from '@/types/database.types';

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Reverse index: normalized catalog name → PlantType
const CATALOG_INDEX = new Map<string, PlantType>();
for (const category of PLANT_CATEGORIES) {
  const plants = DEFAULT_PLANT_CATALOG.categories[category]?.plants ?? [];
  for (const name of plants) {
    CATALOG_INDEX.set(normalize(name), category);
  }
}

// Curated aliases for guild-template / companion / accumulator names that don't
// exact-match the catalog (e.g. "Amaranth" vs catalog "Amaranthus").
const NAME_TYPE_ALIASES: Record<string, PlantType> = {
  amaranth: 'vegetable',           // template row; catalog has "Amaranthus"
  spinach: 'spinach',              // companion/row name; not listed in spinach category
  'black gram (urad)': 'vegetable',// template row includes parenthetical
  'pigeon pea (arhar)': 'vegetable',// template row includes parenthetical
  comfrey: 'herb',                 // dynamic accumulator; not in catalog
};

/**
 * Resolve PlantType for a name without falling back to 'vegetable'.
 * Returns null when the name has no catalog or alias match — callers can
 * detect a true miss vs. the legitimate vegetable category.
 */
export function resolvePlantType(name: string): PlantType | null {
  const key = normalize(name);
  if (!key) return null;
  const alias = NAME_TYPE_ALIASES[key];
  if (alias !== undefined) return alias;
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

import { DEFAULT_PLANT_CATALOG, PLANT_CATEGORIES } from '@/services/plantCatalog';
import { getCanonicalPlantKey, toLookupKey } from '@/utils/plantAliases';
import type { PlantType } from '@/types/database.types';

/** Same normalisation as `toLookupKey`, so the two tables share their keys. */
const normalize = toLookupKey;

// Reverse index: normalized catalog name → PlantType
const CATALOG_INDEX = new Map<string, PlantType>();
for (const category of PLANT_CATEGORIES) {
  const plants = DEFAULT_PLANT_CATALOG.categories[category]?.plants ?? [];
  for (const name of plants) {
    CATALOG_INDEX.set(normalize(name), category);
  }
}

// Curated aliases for guild-template / companion / accumulator names that name
// no catalog row at all, so `PLANT_NAME_ALIASES` cannot resolve them: it maps
// one catalog row's names onto each other, and these have no row to map to.
//
// Consulted before the catalog, so an entry here overrides a real row. Keep it
// to names nothing else can resolve — `satelliteNameCoverage.test.ts` fails on
// any entry the catalog or `PLANT_NAME_ALIASES` has since made redundant.
export const NAME_TYPE_ALIASES: Record<string, PlantType> = {
  spinach: 'spinach',              // companion/row name; not listed in spinach category
  'black gram (urad)': 'vegetable',// template row includes parenthetical
  'pigeon pea (arhar)': 'vegetable',// template row includes parenthetical
  comfrey: 'herb',                 // dynamic accumulator; not in catalog
};

/**
 * Resolve PlantType for a name without falling back to 'vegetable'.
 * Returns null when the name has no catalog or alias match — callers can
 * detect a true miss vs. the legitimate vegetable category.
 *
 * The shared alias table is consulted last, after an exact catalog hit, so a
 * name the catalog knows under another spelling — "Agathi Keerai", or a
 * garden plant still on the dropped "Malabar Spinach" row — resolves to its
 * real category instead of silently defaulting to `vegetable`.
 */
export function resolvePlantType(name: string): PlantType | null {
  const key = normalize(name);
  if (!key) return null;
  const alias = NAME_TYPE_ALIASES[key];
  if (alias !== undefined) return alias;
  const direct = CATALOG_INDEX.get(key);
  if (direct !== undefined) return direct;
  const canonical = getCanonicalPlantKey(name);
  return canonical ? CATALOG_INDEX.get(canonical) ?? null : null;
}

/**
 * Look up the PlantType for a plant name. Falls back to 'vegetable' when no
 * catalog or alias match is found. Used when turning wizard PlantEntry
 * placeholders into real Plant records.
 */
export function plantTypeFromName(name: string): PlantType {
  return resolvePlantType(name) ?? 'vegetable';
}

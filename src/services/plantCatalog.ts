import { PlantCatalog, PlantCatalogCategory, PlantType } from '../types/database.types';
import { getData, KEYS } from '../lib/storage';
import { getCanonicalPlantKey, PLANT_NAME_ALIASES, toLookupKey } from '../utils/plantAliases';
import { PLANT_CATEGORIES } from '../utils/plantCategories';
import { buildPlantCatalog, PLANT_CATALOG_ENTRIES } from '../config/plantCatalog';

// Re-exported because most callers reach the category order through the
// catalog service; the list itself lives in a leaf module both this file and
// `plantLabels.ts` can import.
export { PLANT_CATEGORIES };

/**
 * The bundled catalog, fanned out into the four per-category parallel maps
 * every existing consumer reads.
 *
 * The rows themselves are declared one object each in `@/config/plantCatalog`;
 * this used to be a 600-line hand-written literal in which a plant's Tamil
 * name, description and variety list were three separate keyed entries that
 * nothing tied together. The shape is unchanged — `plantCatalogShape.test.ts`
 * pins it byte-for-byte — so nothing downstream had to move.
 */
export const DEFAULT_PLANT_CATALOG: PlantCatalog = buildPlantCatalog(PLANT_CATALOG_ENTRIES);

const REQUIRED_LOCAL_PLANTS: Partial<Record<PlantType, string[]>> = {
  vegetable: ['Brinjal', 'Ladies Finger', 'Chilli', 'Drumstick', 'Tapioca'],
};
const hasEquivalentPlant = (plants: string[], target: string): boolean => {
  const targetKey = getCanonicalPlantKey(target);
  return plants.some((plant) => getCanonicalPlantKey(plant) === targetKey);
};

const normalizeList = (values: string[] | undefined | null): string[] => {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const trimmed = (value ?? '').toString().trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

const normalizeVarieties = (
  varieties: Record<string, string[]> | undefined | null,
  validPlants: string[]
): Record<string, string[]> => {
  const validPlantMap = new Map(validPlants.map((plant) => [toLookupKey(plant), plant]));
  const result: Record<string, string[]> = {};

  if (!varieties || typeof varieties !== 'object') return result;

  Object.entries(varieties).forEach(([plantName, list]) => {
    const normalizedPlantName = plantName?.toString().trim();
    if (!normalizedPlantName) return;
    const plantKey = toLookupKey(normalizedPlantName);
    const aliasKey = PLANT_NAME_ALIASES[plantKey];
    const canonicalPlantName =
      validPlantMap.get(plantKey) ?? (aliasKey ? validPlantMap.get(aliasKey) : undefined);
    if (!canonicalPlantName) return;
    const normalizedList = normalizeList(list);
    if (normalizedList.length === 0) return;
    result[canonicalPlantName] = normalizedList;
  });

  return result;
};

const createVarietyLookup = (
  varieties: Record<string, string[]> | undefined | null
): Record<string, string[]> => {
  const lookup: Record<string, string[]> = {};
  if (!varieties || typeof varieties !== 'object') return lookup;

  Object.entries(varieties).forEach(([plantName, list]) => {
    const key = toLookupKey(plantName);
    const normalized = normalizeList(list);
    if (!key || normalized.length === 0) return;
    lookup[key] = normalized;
  });

  return lookup;
};

const getKnownVarietiesForPlant = (
  plantName: string,
  defaultVarietyLookup: Record<string, string[]>
): string[] => {
  const plantKey = toLookupKey(plantName);
  const aliasKey = PLANT_NAME_ALIASES[plantKey];
  const defaults =
    defaultVarietyLookup[plantKey] ?? (aliasKey ? defaultVarietyLookup[aliasKey] : undefined);
  return defaults ? [...defaults] : [];
};

const normalizeCategory = (
  category: PlantCatalogCategory | undefined | null,
  defaultPlants: string[],
  defaultVarieties: Record<string, string[]>,
  requiredPlants: string[],
  hasCategory: boolean,
  defaultTamilNames?: Record<string, string>,
  defaultDescriptions?: Record<string, string>
): PlantCatalogCategory => {
  const plants = normalizeList(category?.plants);
  const resolvedPlants = hasCategory ? [...plants] : [...defaultPlants];
  requiredPlants.forEach((plantName) => {
    if (!hasEquivalentPlant(resolvedPlants, plantName)) {
      resolvedPlants.push(plantName);
    }
  });
  const normalizedIncomingVarieties = normalizeVarieties(category?.varieties, resolvedPlants);
  const incomingVarietySet = new Set(
    Object.keys(normalizedIncomingVarieties).map((plant) => toLookupKey(plant))
  );
  const defaultVarietyLookup = createVarietyLookup(defaultVarieties);
  const mergedVarieties: Record<string, string[]> = {
    ...normalizedIncomingVarieties,
  };

  resolvedPlants.forEach((plantName) => {
    if (incomingVarietySet.has(toLookupKey(plantName))) return;
    const defaults = getKnownVarietiesForPlant(plantName, defaultVarietyLookup);
    if (defaults.length > 0) {
      mergedVarieties[plantName] = defaults;
    }
  });

  // Merge tamilNames: incoming overrides defaults
  const mergedTamilNames: Record<string, string> = {
    ...defaultTamilNames,
    ...category?.tamilNames,
  };

  // Merge descriptions: incoming overrides defaults
  const mergedDescriptions: Record<string, string> = {
    ...defaultDescriptions,
    ...category?.descriptions,
  };

  const result: PlantCatalogCategory = {
    plants: resolvedPlants,
    varieties: mergedVarieties,
  };

  if (Object.keys(mergedTamilNames).length > 0) {
    result.tamilNames = mergedTamilNames;
  }
  if (Object.keys(mergedDescriptions).length > 0) {
    result.descriptions = mergedDescriptions;
  }

  return result;
};

export const normalizeCatalog = (catalog?: PlantCatalog | null): PlantCatalog => {
  const categories = {} as Record<PlantType, PlantCatalogCategory>;
  const incomingCategories = catalog?.categories ?? ({} as Record<PlantType, PlantCatalogCategory>);

  PLANT_CATEGORIES.forEach((type) => {
    const defaultCategory = DEFAULT_PLANT_CATALOG.categories[type];
    const incomingCategory = incomingCategories?.[type];
    const hasCategory = Boolean(incomingCategory);
    categories[type] = normalizeCategory(
      incomingCategory,
      defaultCategory.plants,
      defaultCategory.varieties,
      REQUIRED_LOCAL_PLANTS[type] ?? [],
      hasCategory,
      defaultCategory.tamilNames,
      defaultCategory.descriptions
    );
  });

  return { categories };
};

const _getCachedCatalog = async (): Promise<PlantCatalog> => {
  const stored = await getData<PlantCatalog>(KEYS.PLANT_CATALOG);
  if (stored.length > 0 && stored[0]) {
    return normalizeCatalog(stored[0]);
  }

  return DEFAULT_PLANT_CATALOG;
};

/** @deprecated Use getPlantProfiles from @/services/plantProfiles */
export const getPlantCatalog = async (): Promise<PlantCatalog> => {
  const { getPlantProfiles, toPlantCatalogShape } = await import('@/services/plantProfiles');
  return toPlantCatalogShape(await getPlantProfiles());
};

/** @deprecated Mutations go through savePlantProfile in @/services/plantProfiles */
export const savePlantCatalog = async (_catalog: PlantCatalog): Promise<PlantCatalog> => {
  const { logger } = await import('@/utils/logger');
  logger.warn('savePlantCatalog is deprecated — use savePlantProfile instead');
  return _catalog;
};

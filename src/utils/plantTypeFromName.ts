import { DEFAULT_PLANT_CATALOG, PLANT_CATEGORIES } from '@/services/plantCatalog';
import type { PlantType } from '@/types/database.types';

/**
 * Look up the PlantType for a plant name by scanning the default catalog.
 * Used when turning wizard PlantEntry placeholders into real Plant records.
 * Falls back to 'vegetable' when no catalog match is found.
 */
export function plantTypeFromName(name: string): PlantType {
  const target = name.trim().toLowerCase();
  if (!target) return 'vegetable';
  for (const category of PLANT_CATEGORIES) {
    const plants = DEFAULT_PLANT_CATALOG.categories[category]?.plants ?? [];
    if (plants.some((p) => p.toLowerCase() === target)) {
      return category;
    }
  }
  return 'vegetable';
}

import type { PlantType } from '@/types/database.types';
import { buildVarietiesByType, PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';

/**
 * Plant names per category — despite the name, not variety names.
 *
 * This was a hand-maintained second copy of the catalog's name list, kept in
 * step only by a test that existed to notice when it drifted. It is now
 * derived from the same entries the catalog is, so it cannot.
 */
export const PLANT_VARIETIES_BY_TYPE: Record<PlantType, string[]> =
  buildVarietiesByType(PLANT_CATALOG_ENTRIES);

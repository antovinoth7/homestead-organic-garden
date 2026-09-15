import { getCropFamily } from '@/config/plants/catalogTaxonomy';
import { resolvePlantType } from '@/utils/plantTypeFromName';
import type { CropFamily } from '@/types/database.types';

/**
 * The rotation family for a plant name, or null when the name is not a plant the
 * app knows.
 *
 * This used to answer by scanning every guild template's `plant_rows`, so only
 * the 31 names that happened to appear in a template resolved at all — Potato,
 * Cabbage, Cauliflower, Knol Khol, the whole onion family, most cucurbits and
 * every keerai returned null. Rotation reads `crop_family`, so planting Potato
 * after Tomato (both solanaceae) raised no warning. Several template names also
 * did not match the catalog ("Amaranth" vs "Amaranthus", "Black Gram (Urad)"),
 * which is what `NAME_TYPE_ALIASES` in `plantTypeFromName` existed to paper over.
 *
 * Now it resolves through the catalog taxonomy, which derives the family from
 * each plant's own `taxonomicFamily` — so all 129 catalog plants answer, and the
 * alias table means "Okra" and "Methi" answer too.
 */
export function cropFamilyFromName(name: string): CropFamily | null {
  const plantType = resolvePlantType(name);
  if (!plantType) return null;
  return getCropFamily(name, plantType);
}

import { cropFamilyFromName } from '@/utils/cropFamilyFromName';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { deriveInstanceLifecycle } from '@/utils/plantHelpers';
import type { CropFamily, PlantLifecycle, PlantType } from '@/types/database.types';

/** The fields of a plant document this migration reads. */
export interface RecomputeInput {
  plant_variety?: string | null;
  name?: string | null;
  plant_type?: string | null;
  lifecycle_type?: string | null;
  crop_family?: string | null;
}

/** What to write, or null per field when it is already correct. */
export interface RecomputedFields {
  lifecycle_type?: PlantLifecycle;
  crop_family?: CropFamily;
}

const PLANT_TYPES = new Set<string>([
  'vegetable',
  'herb',
  'flower',
  'fruit_tree',
  'timber_tree',
  'coconut_tree',
  'shrub',
  'spinach',
]);

/**
 * Recomputes the two derived fields that were wrong on disk, returning only what
 * actually changes so an unchanged plant costs no write.
 *
 * **`lifecycle_type`** was derived by a rule that checked `plant_type` *before*
 * the catalog's own `lifecycle`, so every `fruit_tree`, `timber_tree` and
 * `coconut_tree` was forced to `permanent` — 36 plants whose catalog value said
 * otherwise. Migration 004 then backfilled that wrong value. The visible cost:
 * only `perennial` plants get the recurring harvest-leaves task, so a banana
 * stand or a pineapple crop never got a harvest prompt.
 *
 * **`crop_family`** was only ever written by the bed-creation wizard, and even
 * there it came from scanning guild templates — so it resolved for a fraction of
 * the rows and was absent on every plant added from the normal form. Rotation
 * reads it, which is why planting Potato after Tomato raised no warning.
 *
 * Neither field is user-editable (nothing in `hooks/`, `components/forms/` or
 * `screens/` writes them), so recomputing cannot overwrite a farmer's choice.
 */
export function recomputePlantFields(data: RecomputeInput): RecomputedFields | null {
  const plantType = data.plant_type;
  if (!plantType || !PLANT_TYPES.has(plantType)) return null;
  const typed = plantType as PlantType;

  const variety = data.plant_variety ?? data.name;
  if (!variety) return null;

  const changes: RecomputedFields = {};

  const profile = getPlantCareProfile(variety, typed);
  const lifecycle = deriveInstanceLifecycle(profile?.lifecycle, typed);
  if (lifecycle !== data.lifecycle_type) changes.lifecycle_type = lifecycle;

  // `cropFamilyFromName` reads the catalog row's own `cropFamily`; null means a
  // name the app does not know, and there is nothing better to write than what
  // is already there.
  const cropFamily = cropFamilyFromName(variety);
  if (cropFamily && cropFamily !== data.crop_family) changes.crop_family = cropFamily;

  return Object.keys(changes).length > 0 ? changes : null;
}

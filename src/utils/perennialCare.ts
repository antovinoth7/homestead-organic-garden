import type { PerennialCareBrief, Plant, PlantLifecycle } from '@/types/database.types';
import { getPlantCareProfile } from '@/utils/plantCareDefaults';
import { deriveInstanceLifecycle, isPlantArchived } from '@/utils/plantHelpers';

function resolvedLifecycle(plant: Plant): PlantLifecycle {
  if (plant.lifecycle_type) return plant.lifecycle_type;
  const variety = plant.plant_variety ?? plant.name;
  const profile = getPlantCareProfile(variety, plant.plant_type);
  return deriveInstanceLifecycle(profile?.lifecycle, plant.plant_type);
}

/** True only for live perennial/permanent records, including legacy records. */
export function isActivePerennial(plant: Plant): boolean {
  if (plant.is_deleted || isPlantArchived(plant)) return false;
  const lifecycle = resolvedLifecycle(plant);
  return lifecycle === 'perennial' || lifecycle === 'permanent';
}

export function getPerennialCareBrief(
  plants: Plant[],
  seasonId: string
): PerennialCareBrief | null {
  const count = plants.filter(isActivePerennial).length;
  if (count === 0) return null;

  const message =
    seasonId === 'summer'
      ? 'Refresh mulch and water only after checking soil moisture.'
      : seasonId === 'cool_dry'
        ? 'Inspect mulch and plan maintenance before the next rains.'
        : 'Check drainage around root zones and remove damaged growth.';

  return { count, message };
}

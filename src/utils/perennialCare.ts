import type { PerennialCareBrief, Plant, PlantLifecycle } from '@/types/database.types';
import type { AgroClimaticZoneId } from '@/config/zones';
import { TODAY_AGRONOMY_EVIDENCE } from '@/config/tamilNaduPlantingCalendar';
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
  seasonId: string,
  zoneId?: AgroClimaticZoneId | null,
  date: Date = new Date()
): PerennialCareBrief | null {
  const count = plants.filter(isActivePerennial).length;
  if (count === 0 || !zoneId) return null;

  const evidenceIds = ['tnau_kitchen_garden', 'tnau_zone_crop_planning'];
  const evidenceIsCurrent = evidenceIds.every((id) => {
    const evidence = TODAY_AGRONOMY_EVIDENCE[id];
    return evidence && date <= new Date(`${evidence.validUntil}T23:59:59`);
  });
  if (!evidenceIsCurrent) return null;

  const wetZone = ['north_eastern', 'cauvery_delta', 'high_rainfall'].includes(zoneId);
  const message =
    (seasonId === 'sw_monsoon' || seasonId === 'ne_monsoon') && wetZone
      ? 'Check drainage around perennial root zones after persistent rain; remove only clearly damaged growth.'
      : 'Check root-zone moisture before watering and keep the soil covered with organic mulch.';

  return { count, message, evidenceIds, reviewedOn: '2026-08-16' };
}

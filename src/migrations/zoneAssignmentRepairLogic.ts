import { getZoneByDistrict } from '@/config/zones';
import type { FarmConfig } from '@/types/database.types';
import { FARM_CONFIG_FIELD } from './farmConfigRepairLogic';

/** Pure decision logic for migration 006. */
export function planZoneAssignmentRepair(
  data: Record<string, unknown>,
  now: () => string = () => new Date().toISOString()
): FarmConfig | null {
  const existing = data[FARM_CONFIG_FIELD] as FarmConfig | undefined;
  if (!existing?.district) return null;

  const zone = getZoneByDistrict(existing.district);
  if (!zone || existing.zone_id === zone.id) return null;

  return { ...existing, zone_id: zone.id, updated_at: now() };
}

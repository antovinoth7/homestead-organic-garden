import { AgroClimaticZone } from './types';
import { HIGH_RAINFALL_ZONE } from './highRainfall';
import { TAMIL_NADU_ZONES } from './tamilNaduZones';

export { HIGH_RAINFALL_ZONE } from './highRainfall';
export { TAMIL_NADU_METEOROLOGICAL_ZONE } from './tamilNaduZones';
export type {
  AgroClimaticZone,
  AgroClimaticZoneId,
  SeasonDefinition,
  SeasonalPestAlert,
} from './types';

export const DEFAULT_ZONE: AgroClimaticZone = HIGH_RAINFALL_ZONE;

export const ZONE_REGISTRY: AgroClimaticZone[] = [...TAMIL_NADU_ZONES, HIGH_RAINFALL_ZONE];

export function getZoneByDistrict(district: string): AgroClimaticZone | null {
  const normalized = district.trim().toLowerCase();
  const found = ZONE_REGISTRY.find((zone) =>
    zone.districts.some((d) => d.toLowerCase() === normalized)
  );
  return found ?? null;
}

export function getZoneById(zoneId: string): AgroClimaticZone | null {
  const found = ZONE_REGISTRY.find((zone) => zone.id === zoneId);
  return found ?? null;
}

export { TAMIL_NADU_DISTRICTS, DEFAULT_DISTRICT } from './districts';

/**
 * Resolve the agro-climatic zone for the user's saved farm config.
 * Keeps a matching explicit `zone_id`, otherwise derives from `district`.
 * An unresolved location stays unresolved; agricultural callers must withhold
 * advice rather than borrow another district's zone.
 */
export function resolveActiveZone(
  config?: { zone_id?: string; district?: string } | null
): AgroClimaticZone | null {
  if (!config) return null;
  const districtZone = config.district ? getZoneByDistrict(config.district) : null;
  const explicitZone = config.zone_id ? getZoneById(config.zone_id) : null;

  // District wins when an older onboarding build stored high_rainfall for every
  // selection. A valid matching explicit choice remains authoritative.
  if (
    explicitZone &&
    (!config.district ||
      explicitZone.districts.some(
        (district) => district.toLowerCase() === config.district?.trim().toLowerCase()
      ))
  ) {
    return explicitZone;
  }
  return districtZone;
}

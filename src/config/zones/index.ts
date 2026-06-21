import { AgroClimaticZone } from './types';
import { HIGH_RAINFALL_ZONE } from './highRainfall';

export { HIGH_RAINFALL_ZONE } from './highRainfall';
export type { AgroClimaticZone, SeasonDefinition, SeasonalPestAlert } from './types';

export const DEFAULT_ZONE: AgroClimaticZone = HIGH_RAINFALL_ZONE;

const ZONE_REGISTRY: AgroClimaticZone[] = [HIGH_RAINFALL_ZONE];

export function getZoneByDistrict(district: string): AgroClimaticZone {
  const normalized = district.trim().toLowerCase();
  const found = ZONE_REGISTRY.find((zone) =>
    zone.districts.some((d) => d.toLowerCase() === normalized)
  );
  return found ?? DEFAULT_ZONE;
}

export function getZoneById(zoneId: string): AgroClimaticZone {
  const found = ZONE_REGISTRY.find((zone) => zone.id === zoneId);
  return found ?? DEFAULT_ZONE;
}

export { TAMIL_NADU_DISTRICTS, DEFAULT_DISTRICT } from './districts';

/**
 * Resolve the agro-climatic zone for the user's saved farm config.
 * Prefers an explicit `zone_id`, then derives from `district`, and finally
 * falls back to the default (Kanyakumari high-rainfall) zone. Lets the captured
 * district actually drive seasons/watering instead of always using DEFAULT_ZONE.
 */
export function resolveActiveZone(
  config?: { zone_id?: string; district?: string } | null
): AgroClimaticZone {
  if (!config) return DEFAULT_ZONE;
  if (config.zone_id) return getZoneById(config.zone_id);
  if (config.district) return getZoneByDistrict(config.district);
  return DEFAULT_ZONE;
}

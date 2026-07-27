/**
 * Farm-size resolution.
 *
 * Land size lives per-plot on `LocationProfile.land_cents`; the single
 * `FarmConfig.land_cents` is deprecated and only consulted for farms set up
 * before per-plot sizes existed.
 */

import type { FarmConfig, LocationProfile } from '@/types/database.types';

/** Used when the farm has no recorded size at all, so recipes still scale to something sane. */
export const DEFAULT_LAND_CENTS = 5;

/** Sum `land_cents` across all per-plot location profiles. */
export function sumLandCents(profiles: Record<string, LocationProfile> | undefined): number {
  return Object.values(profiles ?? {}).reduce((sum, p) => sum + (p.land_cents ?? 0), 0);
}

/** Total farm size in cents, preferring per-plot sizes over the legacy field. */
export function resolveLandCents(
  profiles: Record<string, LocationProfile> | undefined,
  farmConfig: Pick<FarmConfig, 'land_cents'> | null | undefined
): number {
  const fromProfiles = sumLandCents(profiles);
  if (fromProfiles > 0) return fromProfiles;

  const legacy = farmConfig?.land_cents;
  if (legacy && legacy > 0) return legacy;

  return DEFAULT_LAND_CENTS;
}

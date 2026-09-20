import type { FarmConfig } from '@/types/database.types';

/**
 * Pure decision logic for migration 005 (see 005_repair_farm_config.ts).
 *
 * Kept free of Firebase imports so the repair rules are unit-testable in
 * isolation, mirroring the split used by src/utils/offlineQueueLogic.ts.
 */

export const FARM_CONFIG_FIELD = 'farmConfig';

/**
 * Mirrors DEFAULT_FARM_CONFIG in src/services/farmCapacity.ts. Duplicated
 * rather than imported so this module does not pull the service (and its
 * auth/cache/offline-queue dependencies) into the launch path.
 */
const REQUIRED_DEFAULTS: FarmConfig = {
  families_count: 1,
  goals: ['self_sufficiency'],
};

/**
 * Decides what (if anything) migration 005 should write for a given
 * user_settings document. Returns null when there is nothing to repair.
 *
 * Migration 001 wrote `district`/`zone_id` as TOP-LEVEL fields, but every
 * runtime reader looks them up inside the nested `farmConfig` object. This
 * recovers those stranded values without touching data already in the right
 * shape, so the migration is safe to rerun.
 */
export function planFarmConfigRepair(
  data: Record<string, unknown>,
  now: () => string = () => new Date().toISOString()
): FarmConfig | null {
  const existing = data[FARM_CONFIG_FIELD] as FarmConfig | undefined;

  // Already in the shape the app reads — nothing to repair.
  if (existing?.district) return null;

  const legacyDistrict = typeof data.district === 'string' ? data.district : undefined;
  const legacyZoneId = typeof data.zone_id === 'string' ? data.zone_id : undefined;

  // No stranded values to recover. Leave onboarding to populate farmConfig
  // rather than inventing a district here.
  if (!legacyDistrict && !legacyZoneId) return null;

  return {
    ...REQUIRED_DEFAULTS,
    ...existing,
    ...(legacyDistrict ? { district: legacyDistrict } : {}),
    ...(legacyZoneId && !existing?.zone_id ? { zone_id: legacyZoneId } : {}),
    updated_at: now(),
  };
}

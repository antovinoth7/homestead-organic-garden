/**
 * Pure bed domain logic — no Firestore / React Native imports.
 *
 * These helpers are split out from `beds.ts` (which pulls in the Firebase SDK and
 * RN-only modules) so they can be unit-tested in a plain Node environment without
 * the emulator. `beds.ts` re-exports them so existing import sites are unaffected.
 */
import type { Timestamp } from 'firebase/firestore';
import {
  Bed,
  BedType,
  CropFamily,
  Plant,
  PestHistoryItem,
  RotationStatus,
  HarvestGapWarning,
} from '@/types/database.types';
import { convertTimestamp } from '@/utils/dateHelpers';
import { getGreenManureForMonth, checkRotationRules } from '@/config/beds';

// ─── Firestore ↔ App normalisation ───────────────────────────────────────────

export function normalizeBed(id: string, data: Record<string, unknown>): Bed {
  return {
    id,
    user_id: data.user_id as string,
    name: data.name as string,
    type: (data.type as BedType) ?? 'leafy',
    dimensions: (data.dimensions as Bed['dimensions']) ?? {
      width_m: 1.2,
      length_m: 3,
      area_sqm: 3.6,
    },
    sunlight: (data.sunlight as Bed['sunlight']) ?? 'full_sun',
    soil_type: (data.soil_type as Bed['soil_type']) ?? 'garden_soil',
    slope: (data.slope as Bed['slope']) ?? 'flat',
    wind: (data.wind as Bed['wind']) ?? 'moderate',
    prev_land_use: (data.prev_land_use as string) ?? null,
    prev_crop_family: (data.prev_crop_family as CropFamily) ?? null,
    prev_crop_season: (data.prev_crop_season as string) ?? null,
    pest_history: (data.pest_history as PestHistoryItem[]) ?? [],
    water_source: (data.water_source as Bed['water_source']) ?? null,
    irrigation_method: (data.irrigation_method as Bed['irrigation_method']) ?? null,
    parent_location: (data.parent_location as string) ?? null,
    child_location: (data.child_location as string) ?? null,
    is_raised_bed: (data.is_raised_bed as boolean) ?? false,
    is_permanent: (data.is_permanent as boolean) ?? false,
    is_resting: (data.is_resting as boolean) ?? false,
    resting_until: (data.resting_until as string) ?? null,
    last_water_date: (data.last_water_date as string) ?? null,
    last_jeevamrutha_date: (data.last_jeevamrutha_date as string) ?? null,
    last_weeding_date: (data.last_weeding_date as string) ?? null,
    notes: (data.notes as string) ?? null,
    quick_start_applied: (data.quick_start_applied as boolean) ?? false,
    row_layout: data.row_layout as Bed['row_layout'],
    row_history: data.row_history as Bed['row_history'],
    is_deleted: (data.is_deleted as boolean) ?? false,
    created_at: convertTimestamp(data.created_at as Timestamp | string) ?? new Date().toISOString(),
    updated_at: convertTimestamp(data.updated_at as Timestamp | string) ?? new Date().toISOString(),
  };
}

// ─── Rotation / harvest-gap analysis ─────────────────────────────────────────

export function getHarvestGapWarnings(beds: Bed[]): HarvestGapWarning[] {
  // Detect two beds of the same type with overlapping estimated clearing windows (< 21 days apart)
  const warnings: HarvestGapWarning[] = [];
  const bedsByType: Partial<Record<BedType, Bed[]>> = {};

  for (const bed of beds) {
    if (!bedsByType[bed.type]) bedsByType[bed.type] = [];
    bedsByType[bed.type]!.push(bed);
  }

  for (const [type, typeBeds] of Object.entries(bedsByType) as [BedType, Bed[]][]) {
    if (typeBeds.length < 2) continue;
    // Flag all beds of same type as potential gap risk
    for (const bed of typeBeds) {
      warnings.push({
        bed_id: bed.id,
        category: type,
        gap_start: 'current',
        gap_end: 'next_season',
      });
    }
  }

  return warnings;
}

export function getCrossBedStatus(
  beds: Bed[],
  plantsByBedId: Record<string, Plant[]>
): RotationStatus[] {
  return beds.map((bed) => {
    const plants = plantsByBedId[bed.id] ?? [];
    const legumes = plants.filter((p) => p.crop_family === 'legume').length;
    const legume_pct = plants.length > 0 ? Math.round((legumes / plants.length) * 100) : 0;

    const checklist = checkRotationRules({ bed, plants, allBeds: beds });
    const harvestGaps = getHarvestGapWarnings(beds).filter((w) => w.bed_id === bed.id);

    const month = new Date().getMonth() + 1;
    const greenManure = getGreenManureForMonth(month);

    return {
      bed_id: bed.id,
      has_solanaceae_violation: bed.prev_crop_family === 'solanaceae',
      legume_coverage_pct: legume_pct,
      harvest_gap_warnings: harvestGaps,
      coordinator_checklist: checklist,
      green_manure_recommendation: greenManure,
    } satisfies RotationStatus;
  });
}

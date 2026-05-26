import { SunlightLevel, SoilType, BedSlope } from '@/types/database.types';

export interface BedSizeConditions {
  slope: BedSlope;
  soil_type: SoilType;
  sunlight: SunlightLevel;
  waterlogging_risk?: boolean;
}

export interface BedSizeResult {
  width_m: number;
  length_m: number;
  area_sqm: number;
  is_raised_bed: boolean;
  rationale: string;
}

// Raised bed recommended when any of these are true
function shouldRaiseBed(conditions: BedSizeConditions): boolean {
  return (
    conditions.slope === 'moderate' ||
    conditions.slope === 'steep' ||
    conditions.soil_type === 'black_cotton' ||
    conditions.soil_type === 'coastal_sandy' ||
    conditions.waterlogging_risk === true
  );
}

export function getBedSizeRecommendation(conditions: BedSizeConditions): BedSizeResult {
  const raised = shouldRaiseBed(conditions);

  // Max 1.2 m width — reachable from both sides without stepping in
  let width_m = 1.2;
  let length_m = 3.0;

  if (conditions.slope === 'steep') {
    width_m = 1.0;
    length_m = 2.0;
  } else if (conditions.slope === 'moderate') {
    width_m = 1.2;
    length_m = 2.5;
  }

  const area_sqm = parseFloat((width_m * length_m).toFixed(2));

  const parts: string[] = [];
  if (raised) parts.push('raised bed recommended');
  if (conditions.slope !== 'flat') parts.push(`${conditions.slope} slope limits length`);
  if (conditions.soil_type === 'black_cotton')
    parts.push('black cotton soil benefits from raised drainage');
  if (conditions.waterlogging_risk) parts.push('waterlogging risk — raise bed 30 cm');

  const rationale =
    parts.length > 0
      ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('. ') + '.'
      : `Standard ${width_m} m × ${length_m} m ground bed for flat terrain.`;

  return { width_m, length_m, area_sqm, is_raised_bed: raised, rationale };
}

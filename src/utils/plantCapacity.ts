import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';
import type { BedType } from '@/types/database.types';

const MAX_DENSITY_PER_SQM = 8;

/**
 * Estimates how many plants fit in a bed, accounting for companion planting.
 *
 * Min: baseline monoculture density (area × 2).
 * Max: full-companion calculation — the bed length is split equally among all
 *      plant types in the guild; each type's count is capped at MAX_DENSITY_PER_SQM
 *      to prevent tiny herbs from dominating the total.
 */
export function estimatePlantCapacity(
  bedType: BedType | null,
  widthM: number,
  lengthM: number,
): { min: number; max: number } {
  const areaSqm = parseFloat((widthM * lengthM).toFixed(2));
  const min = Math.max(1, Math.round(areaSqm * 2));

  if (!bedType) {
    return { min, max: Math.round(areaSqm * 2.5) };
  }

  const template = GUILD_TEMPLATES[bedType];
  const rows = template.plant_rows;
  const n = rows.length;

  if (n === 0) {
    return { min, max: Math.round(areaSqm * 2.5) };
  }

  const stripLengthM = lengthM / n;
  const shareAreaSqm = widthM * stripLengthM;
  const densityCap = Math.ceil(shareAreaSqm * MAX_DENSITY_PER_SQM);

  const companionTotal = rows.reduce((sum, row) => {
    const spacingM = row.spacing_cm / 100;
    const rowGapM = (row.row_gap_cm ?? row.spacing_cm) / 100;
    const perRow = Math.max(1, Math.floor(widthM / spacingM));
    const strips = Math.max(1, Math.floor(stripLengthM / rowGapM));
    const count = Math.min(perRow * strips, densityCap);
    return sum + count;
  }, 0);

  return { min, max: Math.max(min + 1, companionTotal) };
}

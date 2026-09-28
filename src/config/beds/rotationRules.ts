import { Bed, Plant, CropFamily, RotationRule } from '@/types/database.types';
import { bedExpectsLegumes } from './legumeRelevance';
import { DYNAMIC_ACCUMULATORS } from './dynamicAccumulators';
import { LOW_LEGUME_THRESHOLD } from '@/utils/filterAndSortBeds';
import { REST_BY_PREV_CROP } from './cropFamilyRotation';

/**
 * Seasons a family must stay out of the bed. Read from the shared rotation table
 * so the figure lives next to the reason for it, and so families other than
 * solanaceae can state one — Zingiberaceae needs three, because rhizome rot does
 * not clear in a fortnight.
 */
function restSeasonsFor(family: CropFamily): number | undefined {
  return REST_BY_PREV_CROP[family]?.restSeasons;
}
const MIN_LEGUME_COVERAGE_PCT = LOW_LEGUME_THRESHOLD;
const _MAX_SAME_FAMILY_CONSECUTIVE = 3;

// Canonical accumulator names — single-sourced from the dynamic-accumulator config.
const ACCUMULATOR_NAMES = DYNAMIC_ACCUMULATORS.map((a) => a.name);

// Families that must rest before replanting same-family in the same row.
/**
 * Families that must stay out of a row for a season count, derived from the
 * shared rotation table rather than listed here — so adding a family with a
 * `restSeasons` enrols it in the per-row check automatically.
 */
function rowRestSeasons(family: CropFamily): number | undefined {
  return REST_BY_PREV_CROP[family]?.restSeasons;
}

export interface RowRotationCheck {
  ok: boolean;
  reason?: string;
}

/**
 * Returns whether the candidate crop family is safe to plant in the given row
 * given the bed's `row_history`. Same-family back-to-back in heavy-feeder
 * families (solanaceae, cucurbit) triggers a row-level rest warning even when
 * the bed-wide `prev_crop_family` would allow it elsewhere.
 */
export function validateRowRotation(
  bed: Bed,
  rowIndex: number,
  candidateFamily: CropFamily | null
): RowRotationCheck {
  if (!candidateFamily) return { ok: true };
  const history = bed.row_history ?? [];
  const lastInRow = history
    .filter((h) => h.row_index === rowIndex)
    .sort((a, b) => (a.planted_at < b.planted_at ? 1 : -1))[0];
  if (!lastInRow) return { ok: true };
  const seasons = rowRestSeasons(candidateFamily);
  if (seasons === undefined) return { ok: true };
  if (lastInRow.crop_families.includes(candidateFamily)) {
    return {
      ok: false,
      reason: `Row ${rowIndex} grew ${candidateFamily} last season — rest ${seasons} seasons before replanting same family.`,
    };
  }
  return { ok: true };
}

export interface RotationCheckInput {
  bed: Bed;
  plants: Plant[];
  allBeds: Bed[];
}

function getLegumePct(plants: Plant[]): number {
  if (plants.length === 0) return 0;
  const legumes = plants.filter((p) => p.crop_family === 'legume').length;
  return Math.round((legumes / plants.length) * 100);
}

function hasSolanaceaeViolation(bed: Bed): boolean {
  return bed.prev_crop_family === 'solanaceae';
}

function hasLegumeCoverage(plants: Plant[]): boolean {
  return getLegumePct(plants) >= MIN_LEGUME_COVERAGE_PCT;
}

function hasVariedFamilies(plants: Plant[]): boolean {
  const families = new Set(plants.map((p) => p.crop_family).filter(Boolean) as CropFamily[]);
  return families.size >= 2;
}

function hasDynamicAccumulator(plants: Plant[]): boolean {
  return plants.some((p) => ACCUMULATOR_NAMES.includes(p.plant_variety ?? p.name));
}

function hasNoPestRecurrence(bed: Bed): boolean {
  const recentHighSeverity = (bed.pest_history ?? []).filter(
    (ph) => ph.severity === 'high' || ph.severity === 'severe'
  );
  return recentHighSeverity.length === 0;
}

/**
 * True when the bed is not simply repeating last season's crop family. Distinct from the
 * solanaceae-specific rule: this catches replanting ANY family (e.g. cucurbit after cucurbit).
 */
function hasFamilyRotation(bed: Bed, plants: Plant[]): boolean {
  const prev = bed.prev_crop_family;
  // `other` means "no rotation signal" — it is where tree, palm and every
  // family with no bed crop in it lands — not a family two plants can share.
  // Counting it as one flagged a false repeat between any two unrelated plants
  // that both fell through to it.
  if (!prev || prev === 'other') return true;
  return !plants.some((p) => p.crop_family === prev);
}

export function checkRotationRules(input: RotationCheckInput): RotationRule[] {
  const { bed, plants } = input;

  const rules: RotationRule[] = [
    {
      id: 'solanaceae_rest',
      rule: 'No Solanaceae two seasons in a row',
      passed: !hasSolanaceaeViolation(bed),
      description: hasSolanaceaeViolation(bed)
        ? 'Previous crop was Solanaceae — rest this bed or choose a different family.'
        : 'Previous crop was not Solanaceae. Safe to plant.',
    },
  ];

  // Legume coverage only matters for bed types designed around nitrogen-fixers.
  if (bedExpectsLegumes(bed.type)) {
    rules.push({
      id: 'legume_coverage',
      rule: `Legume coverage ≥ ${MIN_LEGUME_COVERAGE_PCT}%`,
      passed: hasLegumeCoverage(plants),
      description: hasLegumeCoverage(plants)
        ? `Legume coverage is ${getLegumePct(plants)}%. Soil nitrogen is being replenished.`
        : `Legume coverage is only ${getLegumePct(plants)}%. Add cowpea, beans, or fenugreek.`,
    });
  }

  rules.push(
    {
      id: 'family_diversity',
      rule: 'At least 2 crop families in bed',
      passed: hasVariedFamilies(plants),
      description: hasVariedFamilies(plants)
        ? 'Multiple crop families — good diversity reduces disease pressure.'
        : 'All plants are from the same family. Add diversity to reduce pest build-up.',
    },
    {
      id: 'dynamic_accumulator',
      rule: 'At least one dynamic accumulator present',
      passed: hasDynamicAccumulator(plants),
      description: hasDynamicAccumulator(plants)
        ? 'Dynamic accumulator (Agathi / Drumstick / Comfrey / Banana) found. Chop-and-drop scheduled.'
        : 'No dynamic accumulator in bed. Consider adding Agathi or Drumstick.',
    },
    {
      id: 'no_pest_recurrence',
      rule: 'No high-severity pest history in bed',
      passed: hasNoPestRecurrence(bed),
      description: hasNoPestRecurrence(bed)
        ? 'No high-severity pest history recorded.'
        : 'High-severity pests recorded. Apply neem cake and Trichoderma before next planting.',
    },
    {
      id: 'family_rotation',
      rule: "Not repeating last season's crop family",
      passed: hasFamilyRotation(bed, plants),
      description: hasFamilyRotation(bed, plants)
        ? "This season's crops differ from last season's family — good rotation."
        : `Bed still grows ${bed.prev_crop_family} like last season — rotate to a different family or rest ${restSeasonsFor(bed.prev_crop_family!) ?? 2} seasons.`,
    }
  );

  return rules;
}

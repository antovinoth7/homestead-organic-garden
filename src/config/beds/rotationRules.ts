import { Bed, Plant, CropFamily, RotationRule } from '@/types/database.types';

const SOLANACEAE_REST_SEASONS = 2;
const MIN_LEGUME_COVERAGE_PCT = 20;
const _MAX_SAME_FAMILY_CONSECUTIVE = 3;

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
  const accumulators = ['Agathi', 'Moringa', 'Comfrey', 'Banana'];
  return plants.some((p) => accumulators.includes(p.plant_variety ?? p.name));
}

function hasNoPestRecurrence(bed: Bed): boolean {
  const recentHighSeverity = (bed.pest_history ?? []).filter(
    (ph) => ph.severity === 'high' || ph.severity === 'severe'
  );
  return recentHighSeverity.length === 0;
}

function hasSufficientRest(bed: Bed): boolean {
  return bed.prev_crop_family !== 'solanaceae';
}

export function checkRotationRules(input: RotationCheckInput): RotationRule[] {
  const { bed, plants } = input;

  return [
    {
      id: 'solanaceae_rest',
      rule: 'No Solanaceae two seasons in a row',
      passed: !hasSolanaceaeViolation(bed),
      description: hasSolanaceaeViolation(bed)
        ? 'Previous crop was Solanaceae — rest this bed or choose a different family.'
        : 'Previous crop was not Solanaceae. Safe to plant.',
    },
    {
      id: 'legume_coverage',
      rule: `Legume coverage ≥ ${MIN_LEGUME_COVERAGE_PCT}%`,
      passed: hasLegumeCoverage(plants),
      description: hasLegumeCoverage(plants)
        ? `Legume coverage is ${getLegumePct(plants)}%. Soil nitrogen is being replenished.`
        : `Legume coverage is only ${getLegumePct(plants)}%. Add cowpea, beans, or fenugreek.`,
    },
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
        ? 'Dynamic accumulator (Agathi / Moringa / Comfrey / Banana) found. Chop-and-drop scheduled.'
        : 'No dynamic accumulator in bed. Consider adding Agathi or Moringa.',
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
      id: 'adequate_rest',
      rule: 'Adequate rest between heavy-feeding crops',
      passed: hasSufficientRest(bed),
      description: hasSufficientRest(bed)
        ? 'Previous crop family allows direct replanting.'
        : `Previous crop was ${bed.prev_crop_family} — consider green manure rest period of ${SOLANACEAE_REST_SEASONS} seasons.`,
    },
  ];
}

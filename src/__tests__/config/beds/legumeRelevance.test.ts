import { bedExpectsLegumes, LEGUME_RELEVANT_BED_TYPES } from '@/config/beds/legumeRelevance';
import { checkRotationRules } from '@/config/beds/rotationRules';
import type { Bed, BedType } from '@/types/database.types';
import { makePlant } from '../../fixtures/plant.fixtures';

function makeBed(type: BedType): Bed {
  return {
    id: 'b1',
    user_id: 'u1',
    name: 'Test',
    type,
    dimensions: { width_m: 1.2, length_m: 3.0, area_sqm: 3.6 },
    sunlight: 'full_sun',
    soil_type: 'garden_soil',
    slope: 'flat',
    wind: 'moderate',
    pest_history: [],
    is_raised_bed: true,
    is_permanent: false,
    is_deleted: false,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  };
}

const ALL_BED_TYPES: BedType[] = [
  'leafy',
  'fruiting',
  'spice',
  'root_legume',
  'climber_trellis',
  'three_sisters',
  'medicinal_guild',
];

describe('bedExpectsLegumes', () => {
  it('is true only for the legume-focused bed types', () => {
    expect(bedExpectsLegumes('root_legume')).toBe(true);
    expect(bedExpectsLegumes('three_sisters')).toBe(true);
    expect(bedExpectsLegumes('climber_trellis')).toBe(true);
  });

  it('is false for bed types not designed around legumes', () => {
    expect(bedExpectsLegumes('leafy')).toBe(false);
    expect(bedExpectsLegumes('fruiting')).toBe(false);
    expect(bedExpectsLegumes('spice')).toBe(false);
    expect(bedExpectsLegumes('medicinal_guild')).toBe(false);
  });

  it('relevant set and helper agree across all bed types', () => {
    for (const type of ALL_BED_TYPES) {
      expect(bedExpectsLegumes(type)).toBe(LEGUME_RELEVANT_BED_TYPES.has(type));
    }
  });
});

describe('checkRotationRules — legume_coverage gating', () => {
  const plants = [makePlant({ id: 'p1', crop_family: 'solanaceae' })];

  it('includes the legume_coverage rule for legume-relevant beds', () => {
    const bed = makeBed('root_legume');
    const rules = checkRotationRules({ bed, plants, allBeds: [bed] });
    expect(rules.some((r) => r.id === 'legume_coverage')).toBe(true);
  });

  it('omits the legume_coverage rule for non-legume beds', () => {
    for (const type of ['leafy', 'fruiting', 'spice', 'medicinal_guild'] as BedType[]) {
      const bed = makeBed(type);
      const rules = checkRotationRules({ bed, plants, allBeds: [bed] });
      expect(rules.some((r) => r.id === 'legume_coverage')).toBe(false);
    }
  });

  it('always keeps the other rotation rules regardless of bed type', () => {
    const bed = makeBed('fruiting');
    const rules = checkRotationRules({ bed, plants, allBeds: [bed] });
    expect(rules.some((r) => r.id === 'solanaceae_rest')).toBe(true);
    expect(rules.some((r) => r.id === 'family_diversity')).toBe(true);
  });
});

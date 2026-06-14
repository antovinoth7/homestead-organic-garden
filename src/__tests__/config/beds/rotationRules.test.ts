import { checkRotationRules } from '@/config/beds/rotationRules';
import type { Bed, BedType, CropFamily } from '@/types/database.types';
import { makePlant } from '../../fixtures/plant.fixtures';

function makeBed(overrides: Partial<Bed> = {}): Bed {
  return {
    id: 'b1',
    user_id: 'u1',
    name: 'Test',
    type: 'fruiting' as BedType,
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
    ...overrides,
  };
}

const passed = (rules: ReturnType<typeof checkRotationRules>, id: string): boolean =>
  rules.find((r) => r.id === id)?.passed ?? false;

describe('checkRotationRules — solanaceae_rest vs family_rotation are distinct', () => {
  it('family_rotation fails (but solanaceae_rest passes) when repeating a non-solanaceae family', () => {
    const bed = makeBed({ prev_crop_family: 'cucurbit' as CropFamily });
    const plants = [makePlant({ id: 'p1', name: 'Pumpkin', crop_family: 'cucurbit' })];
    const rules = checkRotationRules({ bed, plants, allBeds: [bed] });

    expect(passed(rules, 'solanaceae_rest')).toBe(true); // prev wasn't solanaceae
    expect(passed(rules, 'family_rotation')).toBe(false); // cucurbit after cucurbit
  });

  it('solanaceae_rest fails (but family_rotation passes) after solanaceae with a different family planted', () => {
    const bed = makeBed({ prev_crop_family: 'solanaceae' as CropFamily });
    const plants = [makePlant({ id: 'p1', name: 'Cowpea', crop_family: 'legume' })];
    const rules = checkRotationRules({ bed, plants, allBeds: [bed] });

    expect(passed(rules, 'solanaceae_rest')).toBe(false); // prev was solanaceae
    expect(passed(rules, 'family_rotation')).toBe(true); // not repeating solanaceae
  });

  it('family_rotation passes when there is no previous crop family', () => {
    const bed = makeBed({ prev_crop_family: null });
    const plants = [makePlant({ id: 'p1', crop_family: 'cucurbit' })];
    const rules = checkRotationRules({ bed, plants, allBeds: [bed] });
    expect(passed(rules, 'family_rotation')).toBe(true);
  });

  it('no longer emits the duplicated adequate_rest rule', () => {
    const rules = checkRotationRules({ bed: makeBed(), plants: [], allBeds: [makeBed()] });
    expect(rules.some((r) => r.id === 'adequate_rest')).toBe(false);
    expect(rules.some((r) => r.id === 'family_rotation')).toBe(true);
  });
});

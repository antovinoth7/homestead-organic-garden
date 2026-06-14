import { getSmartNextCrops } from '@/config/beds/bedPlantCatalog';
import { cropFamilyFromName } from '@/utils/cropFamilyFromName';
import type { Bed, BedType, CropFamily } from '@/types/database.types';
import { makePlant } from '../../fixtures/plant.fixtures';

function makeBed(overrides: Partial<Bed> = {}): Bed {
  return {
    id: 'b1',
    user_id: 'u1',
    name: 'Test',
    type: 'root_legume' as BedType,
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

describe('getSmartNextCrops', () => {
  it('excludes crops already planted in the bed', () => {
    const bed = makeBed();
    const result = getSmartNextCrops(bed, [makePlant({ name: 'Cowpea', crop_family: 'legume' })]);
    expect(result).not.toContain('Cowpea');
  });

  it('excludes crops whose family repeats the previous crop family', () => {
    const bed = makeBed({ prev_crop_family: 'legume' as CropFamily });
    const result = getSmartNextCrops(bed, []);
    // No suggested crop should be a legume (same family as last season).
    for (const name of result) {
      expect(cropFamilyFromName(name)).not.toBe('legume');
    }
  });

  it('excludes antagonists of current plants', () => {
    // Onion is an antagonist of Cowpea / French Beans (companionRules).
    const bed = makeBed();
    const result = getSmartNextCrops(bed, [makePlant({ name: 'Onion', crop_family: 'allium' })]);
    expect(result).not.toContain('Cowpea');
    expect(result).not.toContain('French Beans');
  });

  it('surfaces a legume first when the bed expects legumes and coverage is low', () => {
    const bed = makeBed(); // root_legume, no plants → 0% legume coverage
    const result = getSmartNextCrops(bed, []);
    expect(result.length).toBeGreaterThan(0);
    expect(cropFamilyFromName(result[0]!)).toBe('legume');
  });

  it('caps suggestions at five', () => {
    expect(getSmartNextCrops(makeBed(), []).length).toBeLessThanOrEqual(5);
  });
});

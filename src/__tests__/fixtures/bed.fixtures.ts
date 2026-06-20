import { Bed } from '../../types/database.types';

export function makeBed(overrides: Partial<Bed> = {}): Bed {
  return {
    id: 'test-bed-id',
    user_id: 'test-user-id',
    name: 'Test Bed',
    type: 'leafy',
    dimensions: { width_m: 1.2, length_m: 3, area_sqm: 3.6 },
    sunlight: 'full_sun',
    soil_type: 'garden_soil',
    slope: 'flat',
    wind: 'moderate',
    pest_history: [],
    is_raised_bed: false,
    is_permanent: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

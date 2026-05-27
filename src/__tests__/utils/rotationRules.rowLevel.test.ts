import { validateRowRotation } from '@/config/beds/rotationRules';
import type { Bed, BedRowHistoryEntry } from '@/types/database.types';

function makeBed(history: BedRowHistoryEntry[]): Bed {
  return {
    id: 'b1',
    user_id: 'u1',
    name: 'Test',
    type: 'leafy',
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
    row_history: history,
  };
}

describe('validateRowRotation', () => {
  it('passes when no row history exists', () => {
    const bed = makeBed([]);
    expect(validateRowRotation(bed, 1, 'solanaceae').ok).toBe(true);
  });

  it('passes when candidate family is null (unknown)', () => {
    const bed = makeBed([
      {
        row_index: 1,
        layer: 'understory',
        north_edge_cm: 30,
        plants_per_row: 2,
        crop_families: ['solanaceae'],
        species: ['Tomato'],
        planted_at: '2025-01-01',
      },
    ]);
    expect(validateRowRotation(bed, 1, null).ok).toBe(true);
  });

  it('blocks solanaceae in a row that grew solanaceae last season', () => {
    const bed = makeBed([
      {
        row_index: 1,
        layer: 'understory',
        north_edge_cm: 30,
        plants_per_row: 2,
        crop_families: ['solanaceae'],
        species: ['Tomato'],
        planted_at: '2025-01-01',
      },
    ]);
    const check = validateRowRotation(bed, 1, 'solanaceae');
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/solanaceae/i);
  });

  it('allows solanaceae in a different row than the one with solanaceae history', () => {
    const bed = makeBed([
      {
        row_index: 1,
        layer: 'understory',
        north_edge_cm: 30,
        plants_per_row: 2,
        crop_families: ['solanaceae'],
        species: ['Tomato'],
        planted_at: '2025-01-01',
      },
    ]);
    expect(validateRowRotation(bed, 3, 'solanaceae').ok).toBe(true);
  });

  it('does not gate non-rest families like legume', () => {
    const bed = makeBed([
      {
        row_index: 1,
        layer: 'understory',
        north_edge_cm: 30,
        plants_per_row: 2,
        crop_families: ['legume'],
        species: ['Cowpea'],
        planted_at: '2025-01-01',
      },
    ]);
    expect(validateRowRotation(bed, 1, 'legume').ok).toBe(true);
  });

  it('uses the most recent history entry for the row', () => {
    const bed = makeBed([
      {
        row_index: 1,
        layer: 'understory',
        north_edge_cm: 30,
        plants_per_row: 2,
        crop_families: ['solanaceae'],
        species: ['Tomato'],
        planted_at: '2024-01-01',
      },
      {
        row_index: 1,
        layer: 'understory',
        north_edge_cm: 30,
        plants_per_row: 2,
        crop_families: ['other'],
        species: ['Spinach'],
        planted_at: '2025-01-01',
      },
    ]);
    // Most recent (2025) was leafy_green, so solanaceae is now safe.
    expect(validateRowRotation(bed, 1, 'solanaceae').ok).toBe(true);
  });
});

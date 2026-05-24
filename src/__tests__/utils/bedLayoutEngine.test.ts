import { autoArrangePlants, getPlantRadius } from '@/utils/bedLayoutEngine';
import type { Bed, Plant } from '@/types/database.types';

function makeBed(overrides?: Partial<Bed>): Bed {
  return {
    id: 'bed-1',
    user_id: 'user-1',
    name: 'Test Bed',
    type: 'leafy',
    dimensions: { width_m: 1.2, length_m: 3, area_sqm: 3.6 },
    sunlight: 'full_sun',
    soil_type: 'red_laterite',
    slope: 'flat',
    wind: 'sheltered',
    pest_history: [],
    water_source: 'borewell',
    irrigation_method: 'drip',
    is_raised_bed: false,
    is_permanent: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function makePlant(id: string, overrides?: Partial<Plant>): Plant {
  return {
    id,
    user_id: 'user-1',
    name: `Plant ${id}`,
    plant_type: 'vegetable',
    location_id: 'loc-1',
    health_status: 'healthy',
    created_at: '2026-01-01T00:00:00Z',
    bed_id: 'bed-1',
    bed_layer: 'understory',
    spacing_cm: 30,
    ...overrides,
  } as Plant;
}

describe('bedLayoutEngine', () => {
  describe('autoArrangePlants', () => {
    it('returns empty map for no plants', () => {
      const bed = makeBed();
      const result = autoArrangePlants([], bed);
      expect(result.size).toBe(0);
    });

    it('places a single plant within 0–1 range', () => {
      const bed = makeBed();
      const plants = [makePlant('p1')];
      const result = autoArrangePlants(plants, bed);
      expect(result.size).toBe(1);
      const pos = result.get('p1')!;
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(1);
      expect(pos.y).toBeGreaterThanOrEqual(0);
      expect(pos.y).toBeLessThanOrEqual(1);
    });

    it('preserves existing position_in_bed values', () => {
      const bed = makeBed();
      const plants = [makePlant('p1', { position_in_bed: { x: 0.3, y: 0.7 } }), makePlant('p2')];
      const result = autoArrangePlants(plants, bed);
      expect(result.get('p1')).toEqual({ x: 0.3, y: 0.7 });
      // p2 should still be placed
      const p2Pos = result.get('p2')!;
      expect(p2Pos.x).toBeGreaterThanOrEqual(0);
      expect(p2Pos.x).toBeLessThanOrEqual(1);
    });

    it('arranges multiple plants without identical positions', () => {
      const bed = makeBed();
      const plants = [
        makePlant('p1', { spacing_cm: 30 }),
        makePlant('p2', { spacing_cm: 30 }),
        makePlant('p3', { spacing_cm: 30 }),
        makePlant('p4', { spacing_cm: 30 }),
      ];
      const result = autoArrangePlants(plants, bed);
      expect(result.size).toBe(4);

      const positions = [...result.values()];
      // No two plants should have the same exact position
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const same = positions[i]!.x === positions[j]!.x && positions[i]!.y === positions[j]!.y;
          expect(same).toBe(false);
        }
      }
    });

    it('handles many plants in a small bed without crashing', () => {
      const bed = makeBed({ dimensions: { width_m: 0.6, length_m: 1, area_sqm: 0.6 } });
      const plants = Array.from({ length: 12 }, (_, i) => makePlant(`p${i}`, { spacing_cm: 20 }));
      const result = autoArrangePlants(plants, bed);
      expect(result.size).toBe(12);
      // All positions should be in valid range
      for (const pos of result.values()) {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.x).toBeLessThanOrEqual(1);
        expect(pos.y).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeLessThanOrEqual(1);
      }
    });

    it('uses default spacing when spacing_cm is null', () => {
      const bed = makeBed();
      const plants = [makePlant('p1', { spacing_cm: null })];
      const result = autoArrangePlants(plants, bed);
      expect(result.size).toBe(1);
      const pos = result.get('p1')!;
      expect(pos.x).toBeGreaterThanOrEqual(0);
      expect(pos.x).toBeLessThanOrEqual(1);
    });

    it('produces deterministic results for same input', () => {
      const bed = makeBed();
      const plants = [makePlant('p1', { spacing_cm: 25 }), makePlant('p2', { spacing_cm: 40 })];
      const result1 = autoArrangePlants(plants, bed);
      const result2 = autoArrangePlants(plants, bed);
      expect(result1.get('p1')).toEqual(result2.get('p1'));
      expect(result1.get('p2')).toEqual(result2.get('p2'));
    });
  });

  describe('getPlantRadius', () => {
    it('returns a radius between 12 and 30', () => {
      const r = getPlantRadius(30, 120, 300);
      expect(r).toBeGreaterThanOrEqual(12);
      expect(r).toBeLessThanOrEqual(30);
    });

    it('returns larger radius for larger spacing', () => {
      const rSmall = getPlantRadius(15, 120, 300);
      const rLarge = getPlantRadius(90, 120, 300);
      expect(rLarge).toBeGreaterThan(rSmall);
    });

    it('uses default spacing when null', () => {
      const r = getPlantRadius(null, 120, 300);
      expect(r).toBeGreaterThanOrEqual(12);
      expect(r).toBeLessThanOrEqual(30);
    });
  });
});

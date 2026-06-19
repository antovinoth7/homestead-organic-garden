import { getBedOccupancy } from '@/utils/bedOccupancy';
import type { Bed } from '@/types/database.types';

type OccupancyInput = Pick<Bed, 'type' | 'dimensions'> & { active_plant_count: number };

function makeInput(overrides: Partial<OccupancyInput> = {}): OccupancyInput {
  return {
    type: 'leafy',
    dimensions: { width_m: 1.2, length_m: 3.0, area_sqm: 3.6 },
    active_plant_count: 0,
    ...overrides,
  };
}

describe('getBedOccupancy', () => {
  it('reports an empty bed as zero fraction', () => {
    const o = getBedOccupancy(makeInput({ active_plant_count: 0 }));
    expect(o.count).toBe(0);
    expect(o.fraction).toBe(0);
    expect(o.capacity).toBeGreaterThanOrEqual(1);
  });

  it('reports a partial fill between 0 and 1', () => {
    const o = getBedOccupancy(makeInput({ active_plant_count: 1 }));
    expect(o.fraction).toBeGreaterThan(0);
    expect(o.fraction).toBeLessThanOrEqual(1);
    expect(o.count).toBe(1);
  });

  it('clamps an over-capacity bed to a full bar', () => {
    const o = getBedOccupancy(makeInput({ active_plant_count: 9999 }));
    expect(o.fraction).toBe(1);
    expect(o.count).toBe(9999);
  });

  it('keeps capacity at least 1 so the fraction never divides by zero', () => {
    const o = getBedOccupancy(
      makeInput({ dimensions: { width_m: 0, length_m: 0, area_sqm: 0 }, active_plant_count: 0 })
    );
    expect(o.capacity).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(o.fraction)).toBe(true);
  });
});

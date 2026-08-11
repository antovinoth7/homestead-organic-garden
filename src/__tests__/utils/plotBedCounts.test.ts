import { countBedLifecycles } from '@/utils/plotBedCounts';
import type { Bed, Plant } from '@/types/database.types';

const bed = (id: string, overrides: Partial<Bed> = {}): Bed =>
  ({
    id,
    name: id,
    is_permanent: false,
    is_resting: false,
    resting_until: null,
    ...overrides,
  }) as Bed;

const plant = (id: string, archivedAt: string | null = null): Plant =>
  ({ id, archived_at: archivedAt }) as Plant;

describe('countBedLifecycles', () => {
  it('buckets each bed once and totals them', () => {
    const counts = countBedLifecycles(
      [bed('growing'), bed('bare'), bed('resting', { is_resting: true })],
      { growing: [plant('p1')] }
    );
    expect(counts).toEqual({ growing: 1, resting: 1, empty: 1, permanent: 0, total: 3 });
  });

  it('applies the same precedence as the bed list: permanent, then resting, then empty', () => {
    const counts = countBedLifecycles(
      [
        bed('permanent-and-resting', { is_permanent: true, is_resting: true }),
        bed('resting-and-bare', { is_resting: true }),
      ],
      {}
    );
    expect(counts).toEqual({ growing: 0, resting: 1, empty: 0, permanent: 1, total: 2 });
  });

  it('counts a bed holding only archived plants as ready, not growing', () => {
    const counts = countBedLifecycles([bed('cleared')], {
      cleared: [plant('p1', '2026-07-01T00:00:00.000Z')],
    });
    expect(counts.empty).toBe(1);
    expect(counts.growing).toBe(0);
  });

  it('returns an all-zero tally for a plot with no beds', () => {
    expect(countBedLifecycles([], {})).toEqual({
      growing: 0,
      resting: 0,
      empty: 0,
      permanent: 0,
      total: 0,
    });
  });
});

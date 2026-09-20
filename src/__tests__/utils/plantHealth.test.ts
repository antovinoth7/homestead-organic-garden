import { filterPotAndGround, getPlantHealthSummary } from '@/utils/plantHealth';
import { makePlant } from '../fixtures/plant.fixtures';

describe('getPlantHealthSummary', () => {
  it('buckets statuses correctly and ignores soft-deleted plants', () => {
    const plants = [
      makePlant({ id: '1', health_status: 'healthy' }),
      makePlant({ id: '2', health_status: 'recovering' }),
      makePlant({ id: '3', health_status: null }),
      makePlant({ id: '4', health_status: 'stressed' }),
      makePlant({ id: '5', health_status: 'sick' }),
      makePlant({ id: '6', health_status: 'sick', is_deleted: true }),
    ];

    const summary = getPlantHealthSummary(plants);

    expect(summary).toEqual({ healthy: 2, stressed: 1, recovering: 1, sick: 1, total: 5 });
  });

  it('counts recovering separately rather than as healthy', () => {
    const plants = [
      makePlant({ id: '1', health_status: 'healthy' }),
      makePlant({ id: '2', health_status: 'recovering' }),
      makePlant({ id: '3', health_status: 'recovering' }),
    ];

    const summary = getPlantHealthSummary(plants);

    expect(summary.healthy).toBe(1);
    expect(summary.recovering).toBe(2);
  });

  it('returns zeros for an empty list', () => {
    expect(getPlantHealthSummary([])).toEqual({
      healthy: 0,
      stressed: 0,
      recovering: 0,
      sick: 0,
      total: 0,
    });
  });
});

describe('filterPotAndGround', () => {
  it('keeps plants with no bed and drops bed-assigned ones', () => {
    const plants = [
      makePlant({ id: 'pot', bed_id: null }),
      makePlant({ id: 'ground' }),
      makePlant({ id: 'bed', bed_id: 'bed-1' }),
    ];

    expect(filterPotAndGround(plants).map((p) => p.id)).toEqual(['pot', 'ground']);
  });

  it('summarises health over the pot and ground plants only', () => {
    const plants = [
      makePlant({ id: '1', health_status: 'sick', bed_id: null }),
      makePlant({ id: '2', health_status: 'sick', bed_id: 'bed-1' }),
      makePlant({ id: '3', health_status: 'healthy', bed_id: null }),
    ];

    expect(getPlantHealthSummary(filterPotAndGround(plants))).toEqual({
      healthy: 1,
      stressed: 0,
      recovering: 0,
      sick: 1,
      total: 2,
    });
  });

  it('returns an empty list when every plant is in a bed', () => {
    expect(filterPotAndGround([makePlant({ id: '1', bed_id: 'bed-1' })])).toEqual([]);
  });
});

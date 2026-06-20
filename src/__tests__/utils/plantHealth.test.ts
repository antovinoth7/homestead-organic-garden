import { getPlantHealthSummary } from '@/utils/plantHealth';
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

    expect(summary).toEqual({ healthy: 3, stressed: 1, sick: 1, total: 5 });
  });

  it('returns zeros for an empty list', () => {
    expect(getPlantHealthSummary([])).toEqual({ healthy: 0, stressed: 0, sick: 0, total: 0 });
  });
});

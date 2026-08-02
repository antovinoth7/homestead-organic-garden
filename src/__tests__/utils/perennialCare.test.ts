import { getPerennialCareBrief, isActivePerennial } from '@/utils/perennialCare';
import { makePlant } from '../fixtures/plant.fixtures';

describe('perennialCare', () => {
  it('includes active permanent and perennial plants', () => {
    const plants = [
      makePlant({ id: 'tree', lifecycle_type: 'permanent', plant_type: 'fruit_tree' }),
      makePlant({ id: 'herb', lifecycle_type: 'perennial', plant_type: 'herb' }),
      makePlant({ id: 'annual', lifecycle_type: 'annual' }),
    ];

    expect(getPerennialCareBrief(plants, 'sw_monsoon')).toEqual({
      count: 2,
      message: 'Check drainage around root zones and remove damaged growth.',
    });
  });

  it('excludes deleted and archived plants', () => {
    expect(
      getPerennialCareBrief(
        [
          makePlant({ lifecycle_type: 'permanent', is_deleted: true }),
          makePlant({ lifecycle_type: 'perennial', archived_at: '2026-01-01T00:00:00.000Z' }),
        ],
        'summer'
      )
    ).toBeNull();
  });

  it('uses the existing lifecycle fallback for legacy tree records', () => {
    const legacyTree = makePlant({ lifecycle_type: null, plant_type: 'fruit_tree', name: 'Guava' });
    expect(isActivePerennial(legacyTree)).toBe(true);
    expect(getPerennialCareBrief([legacyTree], 'cool_dry')?.message).toBe(
      'Inspect mulch and plan maintenance before the next rains.'
    );
  });
});

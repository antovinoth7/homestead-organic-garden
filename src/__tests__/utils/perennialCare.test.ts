import { getPerennialCareBrief, isActivePerennial } from '@/utils/perennialCare';
import { makePlant } from '../fixtures/plant.fixtures';

describe('perennialCare', () => {
  it('includes active permanent and perennial plants', () => {
    const plants = [
      makePlant({ id: 'tree', lifecycle_type: 'permanent', plant_type: 'fruit_tree' }),
      makePlant({ id: 'herb', lifecycle_type: 'perennial', plant_type: 'herb' }),
      makePlant({ id: 'annual', lifecycle_type: 'annual' }),
    ];

    expect(getPerennialCareBrief(plants, 'sw_monsoon', 'high_rainfall')).toEqual({
      count: 2,
      message:
        'Check drainage around perennial root zones after persistent rain; remove only clearly damaged growth.',
      evidenceIds: ['tnau_kitchen_garden', 'tnau_zone_crop_planning'],
      reviewedOn: '2026-08-16',
    });
  });

  it('excludes deleted and archived plants', () => {
    expect(
      getPerennialCareBrief(
        [
          makePlant({ lifecycle_type: 'permanent', is_deleted: true }),
          makePlant({ lifecycle_type: 'perennial', archived_at: '2026-01-01T00:00:00.000Z' }),
        ],
        'summer',
        'high_rainfall'
      )
    ).toBeNull();
  });

  it('uses the existing lifecycle fallback for legacy tree records', () => {
    const legacyTree = makePlant({ lifecycle_type: null, plant_type: 'fruit_tree', name: 'Guava' });
    expect(isActivePerennial(legacyTree)).toBe(true);
    expect(getPerennialCareBrief([legacyTree], 'cool_dry', 'high_rainfall')?.message).toBe(
      'Check root-zone moisture before watering and keep the soil covered with organic mulch.'
    );
  });

  it('withholds agricultural advice when the zone is unresolved', () => {
    expect(
      getPerennialCareBrief(
        [makePlant({ lifecycle_type: 'perennial', plant_type: 'herb' })],
        'sw_monsoon'
      )
    ).toBeNull();
  });

  it('withholds care after its supporting evidence expires', () => {
    expect(
      getPerennialCareBrief(
        [makePlant({ lifecycle_type: 'perennial', plant_type: 'herb' })],
        'sw_monsoon',
        'high_rainfall',
        new Date(2027, 7, 17)
      )
    ).toBeNull();
  });
});

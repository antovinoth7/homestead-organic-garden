import { getTodaySeasonalAdvisory } from '@/config/todaySeasonalAdvisories';
import { TODAY_AGRONOMY_EVIDENCE } from '@/config/tamilNaduPlantingCalendar';
import { makePlant } from '../fixtures/plant.fixtures';

describe('getTodaySeasonalAdvisory', () => {
  it('matches an active host, resolved zone, and season', () => {
    const advisory = getTodaySeasonalAdvisory(
      [makePlant({ plant_type: 'vegetable' })],
      'high_rainfall',
      'sw_monsoon'
    );

    expect(advisory?.message).toContain('Watch for');
    expect(advisory?.message).not.toMatch(/spotted|observed|infected/i);
    expect(advisory?.evidenceIds.every((id) => TODAY_AGRONOMY_EVIDENCE[id])).toBe(true);
  });

  it('does not match a host-free farm, unrelated zone, or unrelated season', () => {
    const fruitTree = [makePlant({ plant_type: 'fruit_tree' })];
    expect(getTodaySeasonalAdvisory(fruitTree, 'high_rainfall', 'sw_monsoon')).toBeNull();
    expect(
      getTodaySeasonalAdvisory(
        [makePlant({ plant_type: 'vegetable' })],
        'western',
        'sw_monsoon'
      )
    ).toBeNull();
    expect(
      getTodaySeasonalAdvisory(
        [makePlant({ plant_type: 'vegetable' })],
        'high_rainfall',
        'cool_dry'
      )
    ).toBeNull();
  });

  it('does not treat every vegetable as a matching host crop', () => {
    expect(
      getTodaySeasonalAdvisory(
        [makePlant({ name: 'Okra', plant_type: 'vegetable' })],
        'high_rainfall',
        'sw_monsoon'
      )
    ).toBeNull();
  });

  it('ignores archived and deleted host crops', () => {
    expect(
      getTodaySeasonalAdvisory(
        [
          makePlant({ plant_type: 'vegetable', archived_at: '2026-08-01T00:00:00.000Z' }),
          makePlant({ plant_type: 'spinach', is_deleted: true }),
        ],
        'high_rainfall',
        'sw_monsoon'
      )
    ).toBeNull();
  });

  it('withholds an advisory after its evidence review expires', () => {
    expect(
      getTodaySeasonalAdvisory(
        [makePlant({ name: 'Tomato', plant_type: 'vegetable' })],
        'high_rainfall',
        'sw_monsoon',
        new Date(2027, 7, 17)
      )
    ).toBeNull();
  });
});

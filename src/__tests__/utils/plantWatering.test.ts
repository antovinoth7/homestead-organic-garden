import { getPlantWaterStatus, isPlantWaterOverdue } from '@/utils/plantWatering';
import { makePlant } from '../fixtures/plant.fixtures';

const NOW = Date.parse('2026-06-13T12:00:00.000Z');
const DAY = 1000 * 60 * 60 * 24;
const daysAgo = (n: number): string => new Date(NOW - n * DAY).toISOString();

describe('getPlantWaterStatus', () => {
  it('returns none when no watering frequency is set', () => {
    const s = getPlantWaterStatus(makePlant({ watering_frequency_days: null }), NOW);
    expect(s).toEqual({ overdue: false, daysOverdue: 0, reason: 'none' });
  });

  it('returns none when watered within the frequency window', () => {
    const s = getPlantWaterStatus(
      makePlant({ watering_frequency_days: 3, last_watered_date: daysAgo(1) }),
      NOW
    );
    expect(s.reason).toBe('none');
    expect(s.overdue).toBe(false);
  });

  it('flags due_today exactly at the frequency boundary', () => {
    const s = getPlantWaterStatus(
      makePlant({ watering_frequency_days: 3, last_watered_date: daysAgo(3) }),
      NOW
    );
    expect(s.reason).toBe('due_today');
    expect(s.overdue).toBe(true);
    expect(s.daysOverdue).toBe(0);
  });

  it('flags overdue past the frequency window', () => {
    const s = getPlantWaterStatus(
      makePlant({ watering_frequency_days: 3, last_watered_date: daysAgo(5) }),
      NOW
    );
    expect(s.reason).toBe('overdue');
    expect(s.daysOverdue).toBe(2);
  });

  it('flags no_history when never watered but older than the frequency', () => {
    const s = getPlantWaterStatus(
      makePlant({
        watering_frequency_days: 3,
        last_watered_date: null,
        planting_date: daysAgo(10),
      }),
      NOW
    );
    expect(s.reason).toBe('no_history');
    expect(s.daysOverdue).toBe(7);
  });

  it('returns none when never watered but younger than the frequency', () => {
    const s = getPlantWaterStatus(
      makePlant({
        watering_frequency_days: 3,
        last_watered_date: null,
        planting_date: daysAgo(1),
      }),
      NOW
    );
    expect(s.reason).toBe('none');
  });
});

describe('isPlantWaterOverdue', () => {
  it('is true for an overdue plant and false for a freshly watered one', () => {
    const overdue = makePlant({ watering_frequency_days: 3, last_watered_date: daysAgo(5) });
    const fresh = makePlant({ watering_frequency_days: 3, last_watered_date: daysAgo(1) });
    expect(isPlantWaterOverdue(overdue, NOW)).toBe(true);
    expect(isPlantWaterOverdue(fresh, NOW)).toBe(false);
  });
});

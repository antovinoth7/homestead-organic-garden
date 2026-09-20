import {
  getPlantWaterStatus,
  isPlantWaterOverdue,
  getEffectiveWateringIntervalDays,
} from '@/utils/plantWatering';
import { getWateringFrequencyMultiplier } from '@/utils/seasonHelpers';
import { makePlant } from '../fixtures/plant.fixtures';

// The season multiplier reads the live wall-clock season; pin it to 1.0 so the
// calendar-day math below is deterministic. A dedicated test overrides it.
// (jest hoists this mock above the imports above.)
jest.mock('@/utils/seasonHelpers', () => ({
  ...jest.requireActual('@/utils/seasonHelpers'),
  getWateringFrequencyMultiplier: jest.fn(() => 1),
}));

const mockMultiplier = getWateringFrequencyMultiplier as jest.Mock;

const NOW = Date.parse('2026-06-13T12:00:00.000Z');
const DAY = 1000 * 60 * 60 * 24;
const daysAgo = (n: number): string => new Date(NOW - n * DAY).toISOString();

beforeEach(() => {
  mockMultiplier.mockReturnValue(1);
});

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

  it('returns none when watering is disabled, even if past the base frequency', () => {
    const s = getPlantWaterStatus(
      makePlant({
        watering_frequency_days: 3,
        watering_enabled: false,
        last_watered_date: daysAgo(10),
      }),
      NOW
    );
    expect(s).toEqual({ overdue: false, daysOverdue: 0, reason: 'none' });
  });

  it('scales the due window by the season multiplier so it matches the Care Plan', () => {
    // With a 2x monsoon multiplier a 3-day interval becomes ~6 days: still
    // watered 5 days ago is NOT yet due, where the base interval would be overdue.
    mockMultiplier.mockReturnValue(2);
    const s = getPlantWaterStatus(
      makePlant({ watering_frequency_days: 3, last_watered_date: daysAgo(5) }),
      NOW
    );
    expect(s.reason).toBe('none');
  });
});

describe('getEffectiveWateringIntervalDays', () => {
  it('returns null when watering is disabled', () => {
    expect(
      getEffectiveWateringIntervalDays(
        makePlant({ watering_frequency_days: 7, watering_enabled: false })
      )
    ).toBeNull();
  });

  it('returns null when no valid base interval is set', () => {
    expect(
      getEffectiveWateringIntervalDays(makePlant({ watering_frequency_days: null }))
    ).toBeNull();
  });

  it('rounds the base interval scaled by the multiplier (min 1)', () => {
    mockMultiplier.mockReturnValue(2.5);
    expect(
      getEffectiveWateringIntervalDays(makePlant({ watering_frequency_days: 7 }))
    ).toBe(18); // round(7 * 2.5) = 18
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

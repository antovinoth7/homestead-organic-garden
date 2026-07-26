import { formatDaysToHarvest } from '@/utils/growSpecFormat';

describe('formatDaysToHarvest', () => {
  it('returns an empty string when the profile has no range', () => {
    expect(formatDaysToHarvest(undefined)).toBe('');
  });

  it('shows a single figure when the bounds are equal', () => {
    expect(formatDaysToHarvest({ min: 35, max: 35 })).toBe('35 d');
  });

  it('shows both bounds when they differ', () => {
    expect(formatDaysToHarvest({ min: 100, max: 140 })).toBe('100–140 d');
    expect(formatDaysToHarvest({ min: 25, max: 40 })).toBe('25–40 d');
  });
});

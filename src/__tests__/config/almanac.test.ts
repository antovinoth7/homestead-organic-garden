import { ALMANAC, getMonthlyHighlight } from '@/config/almanac';

describe('almanac', () => {
  it('has a dense entry for every month 1–12', () => {
    expect(ALMANAC).toHaveLength(12);
    for (let m = 1; m <= 12; m++) {
      expect(ALMANAC.some((entry) => entry.month === m)).toBe(true);
    }
  });

  it('every entry has highlight, note and icon', () => {
    for (const entry of ALMANAC) {
      expect(entry.highlight.length).toBeGreaterThan(0);
      expect(entry.note.length).toBeGreaterThan(0);
      expect(entry.icon.length).toBeGreaterThan(0);
    }
  });

  it('returns the entry for the given date month', () => {
    expect(getMonthlyHighlight(new Date('2026-06-15')).month).toBe(6);
    expect(getMonthlyHighlight(new Date('2026-01-01')).month).toBe(1);
    expect(getMonthlyHighlight(new Date('2026-12-31')).month).toBe(12);
  });
});

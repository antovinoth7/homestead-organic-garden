import { ALMANAC, getMonthlyHighlight } from '@/config/almanac';
import { getZoneByDistrict } from '@/config/zones';

describe('almanac', () => {
  it('has a dense entry for every month 1–12', () => {
    expect(ALMANAC).toHaveLength(12);
    for (let m = 1; m <= 12; m++) {
      expect(ALMANAC.some((entry) => entry.month === m)).toBe(true);
    }
  });

  it('every entry has a note', () => {
    for (const entry of ALMANAC) {
      expect(entry.note.length).toBeGreaterThan(0);
    }
  });

  it('returns the entry for the given date month', () => {
    expect(getMonthlyHighlight(new Date('2026-06-15')).month).toBe(6);
    expect(getMonthlyHighlight(new Date('2026-01-01')).month).toBe(1);
    expect(getMonthlyHighlight(new Date('2026-12-31')).month).toBe(12);
  });

  it('uses the resolved zone and season for the monthly note', () => {
    const date = new Date(2026, 7, 16);
    const western = getMonthlyHighlight(date, getZoneByDistrict('Coimbatore'), 'sw_monsoon');
    const highRainfall = getMonthlyHighlight(
      date,
      getZoneByDistrict('Kanyakumari'),
      'sw_monsoon'
    );

    expect(western.note).not.toBe(highRainfall.note);
    expect(highRainfall.note).toContain('drainage');
  });
});

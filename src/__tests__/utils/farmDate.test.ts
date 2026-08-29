import {
  addDaysToDateKey,
  calendarDaysBetweenKeys,
  farmDateKey,
  farmDateTimeFromKey,
} from '@/utils/farmDate';

describe('farmDate', () => {
  it('changes day exactly at IST midnight regardless of device timezone', () => {
    expect(farmDateKey('2026-08-21T18:29:59.999Z')).toBe('2026-08-21');
    expect(farmDateKey('2026-08-21T18:30:00.000Z')).toBe('2026-08-22');
  });

  it('builds the standard 18:00 farm due time as an absolute timestamp', () => {
    expect(farmDateTimeFromKey('2026-08-22', 18)?.toISOString()).toBe('2026-08-22T12:30:00.000Z');
  });

  it('crosses month and year boundaries without elapsed-hour arithmetic', () => {
    expect(addDaysToDateKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToDateKey('2028-02-28', 1)).toBe('2028-02-29');
    expect(calendarDaysBetweenKeys('2026-12-31', '2027-01-02')).toBe(2);
  });

  it('rejects malformed date keys', () => {
    expect(farmDateTimeFromKey('22-08-2026')).toBeNull();
    expect(calendarDaysBetweenKeys('bad', '2026-08-22')).toBeNull();
  });

  // farmDateKey caches its answers for string inputs, because the Care Plan
  // calls it several times per task on every filter change and the underlying
  // Intl formatting is comparatively expensive. These pin that the cache is
  // transparent — a cached call must be indistinguishable from a fresh one.
  describe('farmDateKey caching', () => {
    it('returns the same key on repeated calls with the same string', () => {
      const iso = '2026-08-21T18:30:00.000Z';
      const first = farmDateKey(iso);
      expect(farmDateKey(iso)).toBe(first);
      expect(farmDateKey(iso)).toBe('2026-08-22');
    });

    it('agrees with the equivalent Date, which bypasses the cache', () => {
      const iso = '2026-03-15T06:30:00.000Z';
      expect(farmDateKey(iso)).toBe(farmDateKey(new Date(iso)));
    });

    it('keeps returning null for a malformed string, not just the first time', () => {
      // A cached null must be recognised as a real answer rather than a miss.
      expect(farmDateKey('not-a-date')).toBeNull();
      expect(farmDateKey('not-a-date')).toBeNull();
    });

    it('stays correct across enough distinct inputs to trip the cache limit', () => {
      // The cache clears wholesale when full; keys resolved before and after
      // that point must be identical.
      const probe = '2026-01-15T06:30:00.000Z';
      expect(farmDateKey(probe)).toBe('2026-01-15');
      for (let i = 0; i < 5000; i++) {
        farmDateKey(new Date(Date.UTC(2020, 0, 1, 0, 0, i)).toISOString());
      }
      expect(farmDateKey(probe)).toBe('2026-01-15');
    });

    it('still resolves midnight-boundary instants correctly once warm', () => {
      expect(farmDateKey('2026-08-21T18:29:59.999Z')).toBe('2026-08-21');
      expect(farmDateKey('2026-08-21T18:30:00.000Z')).toBe('2026-08-22');
    });
  });
});

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
});

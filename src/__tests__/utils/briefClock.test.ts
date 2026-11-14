import { advanceDay, advanceStaleCheck, STALE_RECHECK_MS } from '@/utils/briefClock';

describe('advanceDay', () => {
  it('keeps the previous object while the calendar day is the same', () => {
    const prev = new Date(2026, 10, 14, 6, 42);
    expect(advanceDay(prev, new Date(2026, 10, 14, 23, 59))).toBe(prev);
  });

  it('moves on once midnight has passed, however little time that took', () => {
    const prev = new Date(2026, 10, 14, 23, 59);
    const now = new Date(2026, 10, 15, 0, 1);
    expect(advanceDay(prev, now)).toBe(now);
  });

  it('does not mistake the same day of another month or year for today', () => {
    const prev = new Date(2026, 10, 14);
    const nextMonth = new Date(2026, 11, 14);
    const nextYear = new Date(2027, 10, 14);
    expect(advanceDay(prev, nextMonth)).toBe(nextMonth);
    expect(advanceDay(prev, nextYear)).toBe(nextYear);
  });
});

describe('advanceStaleCheck', () => {
  const prev = 1_800_000_000_000;

  it('keeps the previous reading inside the recheck window', () => {
    expect(advanceStaleCheck(prev, prev + STALE_RECHECK_MS - 1)).toBe(prev);
  });

  it('takes a new reading once the window has elapsed', () => {
    const now = prev + STALE_RECHECK_MS;
    expect(advanceStaleCheck(prev, now)).toBe(now);
  });

  it('follows a clock that was set backwards', () => {
    expect(advanceStaleCheck(prev, prev - 1000)).toBe(prev - 1000);
  });
});

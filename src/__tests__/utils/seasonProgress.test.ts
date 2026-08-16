import { AgroClimaticZone } from '../../config/zones';
import { HIGH_RAINFALL_ZONE } from '../../config/zones/highRainfall';
import { getSeasonProgress } from '../../utils/seasonProgress';

/** Local-time constructor, matching how the helper builds its boundaries. */
const at = (year: number, month: number, day: number): Date => new Date(year, month - 1, day);

describe('getSeasonProgress — the Kanyakumari zone', () => {
  // The real spans, not the round numbers a mock might use: these are what the
  // season bar reports.
  it.each([
    { seasonId: 'summer', totalWeeks: 14, totalDays: 92, date: at(2026, 3, 1) },
    { seasonId: 'sw_monsoon', totalWeeks: 18, totalDays: 122, date: at(2026, 6, 1) },
    { seasonId: 'ne_monsoon', totalWeeks: 14, totalDays: 92, date: at(2026, 10, 1) },
    { seasonId: 'cool_dry', totalWeeks: 9, totalDays: 59, date: at(2026, 1, 1) },
  ])('reports $seasonId as $totalWeeks weeks / $totalDays days', (spec) => {
    const progress = getSeasonProgress(spec.date);
    expect(progress.seasonId).toBe(spec.seasonId);
    expect(progress.totalWeeks).toBe(spec.totalWeeks);
    expect(progress.totalDays).toBe(spec.totalDays);
  });

  it('starts every season at week 1', () => {
    expect(getSeasonProgress(at(2026, 6, 1)).week).toBe(1);
    expect(getSeasonProgress(at(2026, 10, 1)).week).toBe(1);
  });

  it('opens on day 1 with the whole span still to run', () => {
    const progress = getSeasonProgress(at(2026, 6, 1));
    expect(progress.dayOfSeason).toBe(1);
    expect(progress.daysRemaining).toBe(121);
  });

  it('reaches the last week on the season\'s final day', () => {
    const progress = getSeasonProgress(at(2026, 9, 30));
    expect(progress.seasonId).toBe('sw_monsoon');
    expect(progress.week).toBe(progress.totalWeeks);
    expect(progress.elapsedDays).toBe(progress.totalDays - 1);
  });

  it('leaves nothing remaining on the final day, without overrunning the span', () => {
    const progress = getSeasonProgress(at(2026, 9, 30));
    expect(progress.dayOfSeason).toBe(progress.totalDays);
    expect(progress.daysRemaining).toBe(0);
  });

  it('counts the day and the days left as the same fact from both ends', () => {
    // Mid-August, the case the Today card quotes.
    const progress = getSeasonProgress(at(2026, 8, 16));
    expect(progress.dayOfSeason).toBe(77);
    expect(progress.daysRemaining).toBe(45);
    expect(progress.dayOfSeason + progress.daysRemaining).toBe(progress.totalDays);
  });

  it('advances a week every seven days', () => {
    expect(getSeasonProgress(at(2026, 6, 7)).week).toBe(1);
    expect(getSeasonProgress(at(2026, 6, 8)).week).toBe(2);
    expect(getSeasonProgress(at(2026, 7, 31)).week).toBe(9);
  });

  it('rolls a December season end into the following January', () => {
    const progress = getSeasonProgress(at(2026, 12, 31));
    expect(progress.seasonId).toBe('ne_monsoon');
    expect(progress.week).toBe(progress.totalWeeks);
    expect(progress.elapsedDays).toBe(91);
  });

  it('accounts for a leap-year February', () => {
    // cool_dry is Jan–Feb, so 2028 gains a day over 2026's 59.
    expect(getSeasonProgress(at(2028, 1, 1)).totalDays).toBe(60);
  });

  it('carries the season name, label and month for display', () => {
    const progress = getSeasonProgress(at(2026, 7, 31));
    expect(progress.seasonName).toBe('SW Monsoon');
    expect(progress.seasonLabel).toContain('SW Monsoon');
    expect(progress.monthLabel).toBe('July');
  });

  it('keeps elapsedFraction inside 0–1 across a whole season', () => {
    for (const day of [1, 15, 30]) {
      for (const month of [6, 7, 8, 9]) {
        const { elapsedFraction } = getSeasonProgress(at(2026, month, day));
        expect(elapsedFraction).toBeGreaterThan(0);
        expect(elapsedFraction).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('getSeasonProgress — a season wrapping the new year', () => {
  const wrappingZone: AgroClimaticZone = {
    ...HIGH_RAINFALL_ZONE,
    seasons: [
      { id: 'long_dry', name: 'Long Dry', label: 'Long Dry (Mar–Oct)', startMonth: 3, endMonth: 10 },
      { id: 'wet', name: 'Wet', label: 'Wet (Nov–Feb)', startMonth: 11, endMonth: 2 },
    ],
  };

  it('starts the run in November', () => {
    const progress = getSeasonProgress(at(2026, 11, 1), wrappingZone);
    expect(progress.seasonId).toBe('wet');
    expect(progress.week).toBe(1);
    expect(progress.elapsedDays).toBe(0);
  });

  it('treats January as a continuation of the previous November', () => {
    const progress = getSeasonProgress(at(2027, 1, 1), wrappingZone);
    expect(progress.seasonId).toBe('wet');
    // 30 days of November + 31 of December.
    expect(progress.elapsedDays).toBe(61);
  });

  it('ends on the last day of February', () => {
    const progress = getSeasonProgress(at(2027, 2, 28), wrappingZone);
    expect(progress.week).toBe(progress.totalWeeks);
    expect(progress.elapsedDays).toBe(progress.totalDays - 1);
    expect(progress.daysRemaining).toBe(0);
  });

  it('counts January against the run that started in November', () => {
    const progress = getSeasonProgress(at(2027, 1, 1), wrappingZone);
    expect(progress.dayOfSeason).toBe(62);
    expect(progress.dayOfSeason + progress.daysRemaining).toBe(progress.totalDays);
  });
});

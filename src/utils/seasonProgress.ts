/**
 * Season progress — "Week 8 of 18" plus the fraction that fills the Today
 * screen's season bar.
 *
 * `SeasonDefinition` carries only `startMonth`/`endMonth`, so the week has to be
 * derived from those boundaries. Every date is built with the local-time
 * `new Date(y, m, d)` constructor rather than parsed from ISO, so a timezone or
 * DST shift can never move a week boundary.
 *
 * Pure, with an injectable `date`, so the tests are deterministic.
 */

import { AgroClimaticZone, DEFAULT_ZONE } from '@/config/zones';
import { SeasonProgress } from '@/types/database.types';
import { getCurrentSeason } from '@/utils/seasonHelpers';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * The calendar year the current run of `season` began in. For a season that
 * wraps the new year (`startMonth > endMonth`, e.g. Nov–Feb), a date in
 * January belongs to the run that started last November.
 */
function seasonStartYear(date: Date, startMonth: number, endMonth: number): number {
  const year = date.getFullYear();
  if (startMonth <= endMonth) return year;
  return date.getMonth() + 1 >= startMonth ? year : year - 1;
}

export function getSeasonProgress(
  date: Date = new Date(),
  zone: AgroClimaticZone = DEFAULT_ZONE
): SeasonProgress {
  const seasonId = getCurrentSeason(date, zone);
  const season = zone.seasons.find((s) => s.id === seasonId) ?? zone.seasons[0];

  const monthLabel = date.toLocaleDateString('en-GB', { month: 'long' });

  // A zone with no seasons at all would otherwise divide by zero.
  if (!season) {
    return {
      seasonId,
      seasonName: seasonId,
      seasonLabel: seasonId,
      monthLabel,
      week: 1,
      totalWeeks: 1,
      elapsedDays: 0,
      totalDays: 1,
      dayOfSeason: 1,
      daysRemaining: 0,
      elapsedFraction: 0,
    };
  }

  const startYear = seasonStartYear(date, season.startMonth, season.endMonth);
  const start = new Date(startYear, season.startMonth - 1, 1);

  // Exclusive end: the 1st of the month after `endMonth`. Month 12 rolls into
  // January of the next year on its own, so December needs no special case.
  const endYear = season.startMonth <= season.endMonth ? startYear : startYear + 1;
  const end = new Date(endYear, season.endMonth, 1);

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY));
  const rawElapsed = Math.floor((startOfLocalDay(date).getTime() - start.getTime()) / MS_PER_DAY);
  const elapsedDays = Math.min(Math.max(rawElapsed, 0), totalDays - 1);

  const totalWeeks = Math.ceil(totalDays / 7);
  const week = Math.min(totalWeeks, Math.floor(elapsedDays / 7) + 1);

  return {
    seasonId: season.id,
    seasonName: season.name,
    seasonLabel: season.label,
    monthLabel,
    week,
    totalWeeks,
    elapsedDays,
    totalDays,
    // `elapsedDays` is clamped to `totalDays - 1`, so the last day of a season
    // reads "Day 122 of 122" with nothing remaining rather than overrunning.
    dayOfSeason: elapsedDays + 1,
    daysRemaining: totalDays - elapsedDays - 1,
    elapsedFraction: Math.min(1, Math.max(0, (elapsedDays + 1) / totalDays)),
  };
}

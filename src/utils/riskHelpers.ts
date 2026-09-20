/**
 * Risk helpers shared by the pest and disease reference screens.
 *
 * `seasonalRisk` on PestEntry/DiseaseEntry is keyed by agro-climatic season id
 * (`summer`, `sw_monsoon`, `ne_monsoon`, `cool_dry` in the default zone), so
 * every lookup here goes through the zone definition rather than a hardcoded
 * map — the same source `getCurrentSeason()` uses.
 */

import { AgroClimaticZone, DEFAULT_ZONE } from '@/config/zones';
import { getCurrentSeason } from '@/utils/seasonHelpers';
import type { RiskLevel } from '@/types/database.types';
import type { Theme } from '@/theme/colors';

export type SeasonalRisk = Partial<Record<string, RiskLevel>>;

const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

export interface RiskColors {
  /** Tile / badge background. */
  bg: string;
  /** Label and bar fill. */
  text: string;
}

export function getRiskColor(level: RiskLevel, theme: Theme): RiskColors {
  switch (level) {
    case 'high':
      return { bg: theme.errorLight, text: theme.error };
    case 'moderate':
      return { bg: theme.warningLight, text: theme.warning };
    case 'low':
      return { bg: theme.primaryLight, text: theme.primary };
  }
}

/** Risk recorded for the season we are in right now, if any. */
export function getCurrentRisk(
  seasonalRisk?: SeasonalRisk,
  date?: Date,
  zone?: AgroClimaticZone
): RiskLevel | undefined {
  if (!seasonalRisk) return undefined;
  return seasonalRisk[getCurrentSeason(date, zone)];
}

/** Full season label ("Summer (Mar–May)") for a season id. */
export function getSeasonLabelById(seasonId: string, zone?: AgroClimaticZone): string {
  const z = zone ?? DEFAULT_ZONE;
  return z.seasons.find((s) => s.id === seasonId)?.label ?? seasonId;
}

/** Short season name ("Summer") for a season id. */
export function getSeasonNameById(seasonId: string, zone?: AgroClimaticZone): string {
  const z = zone ?? DEFAULT_ZONE;
  return z.seasons.find((s) => s.id === seasonId)?.name ?? seasonId;
}

export interface SeasonRiskBar {
  seasonId: string;
  /** Month-range abbreviation used as the bar's axis label (MAR–MAY, JUN–SEP, …). */
  monthLabel: string;
  /** Season length in months — the bar's flex weight, so the strip reads as a calendar. */
  monthCount: number;
  name: string;
  level?: RiskLevel;
  isCurrent: boolean;
}

/** Season length in months, handling seasons that wrap past December. */
function getMonthCount(startMonth: number, endMonth: number): number {
  return endMonth >= startMonth ? endMonth - startMonth + 1 : 12 - startMonth + endMonth + 1;
}

/** "JUN–SEP" for a range, "JUN" for a single-month season. */
function getMonthRangeLabel(startMonth: number, endMonth: number, fallback: string): string {
  const start = MONTH_ABBREVIATIONS[startMonth - 1];
  const end = MONTH_ABBREVIATIONS[endMonth - 1];
  if (!start || !end) return fallback;
  return start === end ? start : `${start}–${end}`;
}

/**
 * One bar per zone season, in calendar order as declared by the zone, so the
 * detail screen's risk strip always renders a fixed number of columns even
 * when an entry only records risk for one season.
 */
export function getSeasonRiskBars(
  seasonalRisk?: SeasonalRisk,
  date?: Date,
  zone?: AgroClimaticZone
): SeasonRiskBar[] {
  const z = zone ?? DEFAULT_ZONE;
  const current = getCurrentSeason(date, z);

  return z.seasons.map((season) => ({
    seasonId: season.id,
    monthLabel: getMonthRangeLabel(
      season.startMonth,
      season.endMonth,
      season.name.toUpperCase()
    ),
    monthCount: getMonthCount(season.startMonth, season.endMonth),
    name: season.name,
    level: seasonalRisk?.[season.id],
    isCurrent: season.id === current,
  }));
}

/** Highest risk the entry reaches in any season — used to sort the list. */
export function getPeakRisk(seasonalRisk?: SeasonalRisk): RiskLevel | undefined {
  if (!seasonalRisk) return undefined;
  const levels = Object.values(seasonalRisk);
  if (levels.includes('high')) return 'high';
  if (levels.includes('moderate')) return 'moderate';
  if (levels.includes('low')) return 'low';
  return undefined;
}

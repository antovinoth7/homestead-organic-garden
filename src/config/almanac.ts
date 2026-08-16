/** Monthly, district-aware guidance for the Today seasonal card. */

import type { VisualIconKey } from '@/types/visual.types';
import type { AgroClimaticZone } from '@/config/zones';

export interface AlmanacMonth {
  /** 1-12 */
  month: number;
  label: string;
  highlight: string;
  note: string;
  iconKey: VisualIconKey;
}

export const ALMANAC: AlmanacMonth[] = [
  {
    month: 1,
    label: 'January',
    highlight: 'Cool-dry harvests',
    note: 'Harvest short-duration greens and pulses. Check soil moisture before watering.',
    iconKey: 'growth.mature',
  },
  {
    month: 2,
    label: 'February',
    highlight: 'Summer sowing starts',
    note: 'Prepare beds for warm-season crops. Sow amaranthus, gourds, and cowpea; add compost.',
    iconKey: 'growth.seedling',
  },
  {
    month: 3,
    label: 'March',
    highlight: 'Protect new seedlings',
    note: 'Provide shade for recent seedlings and water only after checking soil moisture.',
    iconKey: 'weather.clear',
  },
  {
    month: 4,
    label: 'April',
    highlight: 'Peak summer care',
    note: 'Keep bare soil mulched and focus on heat-tolerant leafy crops while preparing beds.',
    iconKey: 'task.mulch',
  },
  {
    month: 5,
    label: 'May',
    highlight: 'Pre-monsoon preparation',
    note: 'Refresh mulch, clear drainage paths, and prepare beds before the southwest monsoon.',
    iconKey: 'task.cultivating',
  },
  {
    month: 6,
    label: 'June',
    highlight: 'SW monsoon onset',
    note: 'Start monsoon crops in raised, well-drained beds and check drainage after heavy rain.',
    iconKey: 'weather.rain',
  },
  {
    month: 7,
    label: 'July',
    highlight: 'Monsoon growth',
    note: 'Stake climbers, manage weeds, and sow successive leafy crops in well-drained soil.',
    iconKey: 'growth.vegetative',
  },
  {
    month: 8,
    label: 'August',
    highlight: 'Mid-monsoon',
    note: 'Use raised, well-drained beds for monsoon crops; postpone direct sowing in standing water.',
    iconKey: 'task.water',
  },
  {
    month: 9,
    label: 'September',
    highlight: 'Season transition',
    note: 'Clear finished monsoon beds and begin short-duration greens and pulses for the next season.',
    iconKey: 'task.harvest',
  },
  {
    month: 10,
    label: 'October',
    highlight: 'NE monsoon begins',
    note: 'Maintain drainage through the northeast monsoon and sow short-duration greens in raised beds.',
    iconKey: 'weather.rain',
  },
  {
    month: 11,
    label: 'November',
    highlight: 'Rabi planting',
    note: 'Continue beetroot and fenugreek sowing; transplant onion seedlings where drainage is sound.',
    iconKey: 'growth.seedling',
  },
  {
    month: 12,
    label: 'December',
    highlight: 'Next-cycle preparation',
    note: 'Harvest tender greens, refresh compost, and transplant tomato seedlings for the next cycle.',
    iconKey: 'task.fertilise',
  },
];

const ZONE_SEASON_NOTES: Record<string, Record<string, string>> = {
  north_eastern: {
    sw_monsoon: 'Keep irrigation conditional on actual soil moisture and prepare drainage before the northeast monsoon.',
    ne_monsoon: 'Protect low beds from standing water during the region’s main rainy season.',
  },
  north_western: {
    sw_monsoon: 'Conserve received rain with mulch; do not assume an unwatered bed has enough moisture.',
    ne_monsoon: 'Check stored soil moisture before sowing and keep supplemental water available.',
  },
  western: {
    sw_monsoon: 'Use wind and rain exposure at the plot—not the calendar alone—to decide watering.',
    ne_monsoon: 'Check root-zone moisture and drainage before starting a new bed.',
  },
  cauvery_delta: {
    sw_monsoon: 'Keep bed drains open and avoid sowing into saturated low-lying soil.',
    ne_monsoon: 'Northeast-monsoon rain can waterlog beds quickly; drain standing water before field work.',
  },
  southern: {
    sw_monsoon: 'Confirm irrigation and stored soil moisture before starting a crop in this drier zone.',
    ne_monsoon: 'Use received northeast-monsoon rain, but inspect low beds after heavy spells.',
  },
  south: {
    sw_monsoon: 'Confirm irrigation and plot moisture before treating the planting window as actionable.',
    ne_monsoon: 'Check both drainage and stored moisture; rainfall varies substantially within the zone.',
  },
  high_rainfall: {
    sw_monsoon: 'Keep drainage channels open and postpone direct sowing while water is standing.',
    ne_monsoon: 'Inspect root zones after heavy rain and avoid routine watering without a soil check.',
  },
  hilly: {
    sw_monsoon: 'Elevation and slope change conditions sharply; protect soil from erosion and check drainage.',
    ne_monsoon: 'Use the plot’s temperature, exposure, and soil moisture before acting on a calendar window.',
  },
};

/** The almanac entry for the given date's calendar month. */
export function getMonthlyHighlight(
  date: Date = new Date(),
  zone?: AgroClimaticZone | null,
  seasonId?: string
): AlmanacMonth {
  const month = date.getMonth() + 1;
  const entry = ALMANAC.find((candidate) => candidate.month === month) ?? ALMANAC[0]!;
  const zoneNote = zone && seasonId ? ZONE_SEASON_NOTES[zone.id]?.[seasonId] : undefined;
  return zoneNote ? { ...entry, note: zoneNote } : entry;
}

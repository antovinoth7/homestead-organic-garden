/** Monthly, district-aware guidance for the Today seasonal card. */

import type { VisualIconKey } from '@/types/visual.types';

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

/** The almanac entry for the given date's calendar month. */
export function getMonthlyHighlight(date: Date = new Date()): AlmanacMonth {
  const month = date.getMonth() + 1;
  return ALMANAC.find((entry) => entry.month === month) ?? ALMANAC[0]!;
}

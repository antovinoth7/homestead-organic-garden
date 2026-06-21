/**
 * Seasonal almanac — monthly highlights for the Kanyakumari / Tamil Nadu
 * organic calendar (Phase C, C.4 / G15 Farmer's Almanac).
 *
 * Pure config consumed by the dashboard AlmanacHighlight card and the full
 * SeasonalAlmanacScreen. Each entry is a short, actionable monthly note.
 */

export interface AlmanacMonth {
  /** 1–12 */
  month: number;
  label: string;
  /** Headline activity for the month. */
  highlight: string;
  /** One-line guidance for the gardener. */
  note: string;
  icon: string;
}

export const ALMANAC: AlmanacMonth[] = [
  {
    month: 1,
    label: 'January',
    highlight: 'Cool-dry harvests',
    note: 'Harvest Rabi greens and pulses. Mulch to hold soil moisture as rains taper.',
    icon: '🥬',
  },
  {
    month: 2,
    label: 'February',
    highlight: 'Summer sowing prep',
    note: 'Prepare beds for summer crops. Sow okra, gourds, and amaranth; add compost.',
    icon: '🌱',
  },
  {
    month: 3,
    label: 'March',
    highlight: 'Beat the heat',
    note: 'Water every 2 days. Provide shade for seedlings; sow heat-tolerant greens.',
    icon: '☀️',
  },
  {
    month: 4,
    label: 'April',
    highlight: 'Peak summer care',
    note: 'Heavy mulching and evening watering. Harvest mango; protect fruiting beds.',
    icon: '🥭',
  },
  {
    month: 5,
    label: 'May',
    highlight: 'Pre-monsoon prep',
    note: 'Lay fresh mulch, clean drip lines, prepare Jeevamrutha before the rains.',
    icon: '🛠️',
  },
  {
    month: 6,
    label: 'June',
    highlight: 'SW Monsoon onset',
    note: 'Sow Kharif crops and green manure. Check drainage; switch to rain-fed care.',
    icon: '🌧️',
  },
  {
    month: 7,
    label: 'July',
    highlight: 'Monsoon growth',
    note: 'Manage weeds and fungal risk. Stake climbers; sow successive leafy crops.',
    icon: '🌿',
  },
  {
    month: 8,
    label: 'August',
    highlight: 'Mid-monsoon',
    note: 'Chop-and-drop accumulators. Watch for waterlogging on low beds.',
    icon: '💦',
  },
  {
    month: 9,
    label: 'September',
    highlight: 'Kharif harvest',
    note: 'Harvest monsoon crops. Prepare beds for the NE monsoon / Rabi season.',
    icon: '🧺',
  },
  {
    month: 10,
    label: 'October',
    highlight: 'NE Monsoon begins',
    note: 'Heaviest rains — ensure drainage daily. Sow Rabi pulses and greens.',
    icon: '🌧️',
  },
  {
    month: 11,
    label: 'November',
    highlight: 'Rabi planting',
    note: 'Transplant winter vegetables. Apply Jeevamrutha every 12 days.',
    icon: '🌾',
  },
  {
    month: 12,
    label: 'December',
    highlight: 'Fruit-tree flowering',
    note: 'Mango and jackfruit flower. Prune for shape; sow cool-season crops.',
    icon: '🌸',
  },
];

/** The almanac entry for the given date's calendar month. */
export function getMonthlyHighlight(date: Date = new Date()): AlmanacMonth {
  const month = date.getMonth() + 1;
  // ALMANAC is dense (1–12) so the find always resolves; fall back defensively.
  return ALMANAC.find((m) => m.month === month) ?? ALMANAC[0]!;
}

/**
 * Seasonal adaptation rules for Kanyakumari / Tamil Nadu organic farming.
 * Shows how task frequencies change across the 4 seasons.
 */

export interface SeasonalFrequency {
  seasonId: string;
  seasonLabel: string;
  waterInterval: string;
  waterDays: number;
  mulchCheck: string;
  mulchDays: number;
  jeevamruthaInterval: string;
  jeevamruthaDays: number;
}

export const SEASONAL_FREQUENCIES: SeasonalFrequency[] = [
  {
    seasonId: 'summer',
    seasonLabel: 'Summer (Mar–May)',
    waterInterval: 'Every 2 days',
    waterDays: 2,
    mulchCheck: 'Check weekly',
    mulchDays: 7,
    jeevamruthaInterval: 'Every 10 days',
    jeevamruthaDays: 10,
  },
  {
    seasonId: 'sw_monsoon',
    seasonLabel: 'SW Monsoon (Jun–Sep)',
    waterInterval: 'Rain-fed',
    waterDays: 0,
    mulchCheck: 'Check fortnightly',
    mulchDays: 14,
    jeevamruthaInterval: 'Every 15 days',
    jeevamruthaDays: 15,
  },
  {
    seasonId: 'ne_monsoon',
    seasonLabel: 'NE Monsoon (Oct–Dec)',
    waterInterval: 'Every 3 days',
    waterDays: 3,
    mulchCheck: 'Check weekly',
    mulchDays: 7,
    jeevamruthaInterval: 'Every 12 days',
    jeevamruthaDays: 12,
  },
  {
    seasonId: 'cool_dry',
    seasonLabel: 'Cool Dry (Jan–Feb)',
    waterInterval: 'Every 3 days',
    waterDays: 3,
    mulchCheck: 'Check monthly',
    mulchDays: 30,
    jeevamruthaInterval: 'Every 14 days',
    jeevamruthaDays: 14,
  },
];

// ─── Pre-Monsoon Batch Tasks ─────────────────────────────────────────────────

export interface PreMonsoonTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'bed_prep' | 'input' | 'infrastructure' | 'planting';
}

/** SW Monsoon starts June 1 in Kanyakumari zone */
export const SW_MONSOON_START_DAY = 152; // June 1 (day-of-year in non-leap year)

export const PRE_MONSOON_WINDOW_DAYS = 21;

export const PRE_MONSOON_TASKS: PreMonsoonTask[] = [
  {
    id: 'pre_monsoon_mulch',
    title: 'Lay fresh mulch on all active beds',
    description:
      'Apply 10–15 cm layer of dried leaves, coconut husk, or straw to protect soil from monsoon erosion.',
    icon: '🍂',
    category: 'bed_prep',
  },
  {
    id: 'pre_monsoon_shadenet',
    title: 'Install shade-net on fruiting beds',
    description:
      'Protect fruiting crops from heavy rain damage. Use 50% shade-net secured with bamboo stakes.',
    icon: '🛡️',
    category: 'infrastructure',
  },
  {
    id: 'pre_monsoon_jeevamrutha',
    title: 'Prepare first Jeevamrutha batch of the season',
    description:
      'Start a fresh batch so it is ready by monsoon onset. Higher microbial activity benefits wet-season soil.',
    icon: '🧪',
    category: 'input',
  },
  {
    id: 'pre_monsoon_drip',
    title: 'Clean and inspect drip lines',
    description:
      'Flush all drip lines, check for blockages and leaks. Monsoon debris can clog emitters.',
    icon: '💧',
    category: 'infrastructure',
  },
  {
    id: 'pre_monsoon_greenmanure',
    title: 'Sow Cowpea green manure on resting beds',
    description:
      'Cowpea (Karamani) fixes nitrogen and provides ground cover during monsoon. Chop-and-drop at 45 days.',
    icon: '🌱',
    category: 'planting',
  },
];

/**
 * Get the current season's frequency row.
 */
export function getFrequencyForSeason(seasonId: string): SeasonalFrequency | undefined {
  return SEASONAL_FREQUENCIES.find((f) => f.seasonId === seasonId);
}

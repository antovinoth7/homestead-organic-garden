import { GreenManureRecommendation } from '@/types/database.types';

// Month (1–12) → green manure for Kanyakumari / Tamil Nadu seasons
// Summer: Mar–May (months 3–5) → Sunhemp
// SW Monsoon: Jun–Sep (months 6–9) → Cowpea
// NE Monsoon / retreating: Oct–Jan (months 10–1) → Dhaincha
// Feb is transitional → Sunhemp pre-sowing

const GREEN_MANURE_BY_MONTH: Record<number, GreenManureRecommendation> = {
  1: {
    name: 'Dhaincha',
    tamilName: 'தைஞ்சா',
    sow_month: 1,
    rationale: 'NE monsoon residual moisture — Dhaincha fixes nitrogen before summer crops',
  },
  2: {
    name: 'Sunhemp',
    tamilName: 'சணல்',
    sow_month: 2,
    rationale: 'Pre-summer sowing — Sunhemp grows fast before heat peaks',
  },
  3: {
    name: 'Sunhemp',
    tamilName: 'சணல்',
    sow_month: 3,
    rationale: 'Summer — Sunhemp is drought-tolerant, adds biomass quickly',
  },
  4: {
    name: 'Sunhemp',
    tamilName: 'சணல்',
    sow_month: 4,
    rationale: 'Peak summer — chop-and-drop before SW monsoon to build soil',
  },
  5: {
    name: 'Sunhemp',
    tamilName: 'சணல்',
    sow_month: 5,
    rationale: 'Late summer — incorporate before monsoon rains begin',
  },
  6: {
    name: 'Cowpea',
    tamilName: 'காராமணி',
    sow_month: 6,
    rationale: 'SW Monsoon onset — Cowpea thrives in warm wet conditions',
  },
  7: {
    name: 'Cowpea',
    tamilName: 'காராமணி',
    sow_month: 7,
    rationale: 'SW Monsoon — Cowpea fixes 50–80 kg N/ha, doubles as food',
  },
  8: {
    name: 'Cowpea',
    tamilName: 'காராமணி',
    sow_month: 8,
    rationale: 'SW Monsoon — chop before pod set for maximum nitrogen benefit',
  },
  9: {
    name: 'Cowpea',
    tamilName: 'காராமணி',
    sow_month: 9,
    rationale: 'Retreating monsoon — incorporate before NE monsoon crops',
  },
  10: {
    name: 'Dhaincha',
    tamilName: 'தைஞ்சா',
    sow_month: 10,
    rationale: 'NE Monsoon onset — Dhaincha tolerates waterlogging, ideal for low-lying beds',
  },
  11: {
    name: 'Dhaincha',
    tamilName: 'தைஞ்சா',
    sow_month: 11,
    rationale: 'NE Monsoon — Dhaincha builds organic matter for winter crops',
  },
  12: {
    name: 'Dhaincha',
    tamilName: 'தைஞ்சா',
    sow_month: 12,
    rationale: 'NE Monsoon — incorporate before January harvest season',
  },
};

export function getGreenManureForMonth(month: number): GreenManureRecommendation {
  const m = ((month - 1 + 12) % 12) + 1;
  return GREEN_MANURE_BY_MONTH[m]!;
}

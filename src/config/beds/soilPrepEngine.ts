import type { SoilType, CropFamily, PestHistoryItem } from '@/types/database.types';
import { getGreenManureForMonth } from './greenManureEngine';

export interface PrepStep {
  number: string;
  text: string;
  detail: string;
}

export interface SoilPrepParams {
  soil_type: SoilType;
  prev_crop_family: CropFamily | null;
  prev_crop_season: string | null;
  pest_history: PestHistoryItem[];
  currentMonth: number;
}

// Soil-type specific amendment steps (numbers 1–3)
const SOIL_BASE_STEPS: Partial<Record<SoilType, { text: string; detail: string }[]>> = {
  laterite: [
    { text: 'Dig 45cm once', detail: 'Break laterite hardpan. Never dig again after this.' },
    {
      text: 'Coir pith compost 4kg/sqm',
      detail: 'Dramatically improves water retention in laterite.',
    },
    { text: 'Lasagne layers', detail: 'Dry leaves 5cm → compost 10cm → topsoil mix.' },
  ],
  red_loam: [
    { text: 'Loosen top 30cm', detail: 'Red loam is workable — no hardpan digging needed.' },
    { text: 'Compost 2kg/sqm', detail: 'Adds organic matter and improves drainage balance.' },
    {
      text: 'Mulch 5cm before planting',
      detail: 'Prevents moisture loss in warm Tamil Nadu summers.',
    },
  ],
  garden_soil: [
    { text: 'Fork top 20cm', detail: 'Loosen compacted surface, break clods.' },
    { text: 'Compost 2kg/sqm', detail: 'Replenish organic matter after previous crop.' },
    { text: 'Level and rake', detail: 'Even surface for uniform water distribution.' },
  ],
  black_cotton: [
    {
      text: 'Raised bed essential — 30cm height',
      detail: 'Black cotton swells when wet; raising prevents waterlogging.',
    },
    {
      text: 'Add coarse sand + compost 1:1',
      detail: 'Breaks clay structure and improves drainage.',
    },
    {
      text: 'Work only when dry',
      detail: 'Never dig black cotton when wet — it seals into hard blocks.',
    },
  ],
  coastal_sandy: [
    {
      text: 'Add 5–8kg compost/sqm',
      detail: 'Sandy soil has zero water retention — heavy organic input is critical.',
    },
    {
      text: 'Clay slurry layer 2cm below surface',
      detail: 'Slows water drainage; keeps nutrients in root zone.',
    },
    { text: 'Lasagne layers', detail: 'Dry leaves 5cm → compost 10cm → topsoil mix.' },
  ],
  clay_loam: [
    { text: 'Break surface crust first', detail: 'Dry clay crust prevents water penetration.' },
    { text: 'Compost + coarse sand 3kg/sqm', detail: 'Improves drainage and root penetration.' },
    { text: 'Avoid walking on bed after rain', detail: 'Clay compacts easily when wet.' },
  ],
  sandy_loam: [
    { text: 'Fork top 25cm', detail: 'Sandy loam is easy to work — light loosening is enough.' },
    { text: 'Compost 2kg/sqm', detail: 'Maintains organic matter for healthy soil biology.' },
    {
      text: 'Level and water 2 days before planting',
      detail: 'Settles the bed and activates soil microbes.',
    },
  ],
};

// Rest period text by previous crop family
const REST_BY_PREV_CROP: Record<string, { days: string; reason: string }> = {
  solanaceae: { days: '14 days', reason: 'clear solanaceae soil pathogens' },
  cucurbit: { days: '10 days', reason: 'remove vine debris and reset fungal load' },
  brassica: { days: '7 days', reason: 'brassica debris mildly inhibits next planting' },
  allium: { days: '14 days', reason: 'allium residue inhibits legume germination' },
  legume: { days: '3 days', reason: 'excellent rotation — minimal rest needed' },
  other: { days: '5 days', reason: 'standard rest between crop families' },
};

// Pest-history additions to the prep list
const PEST_ADDITIONS: Record<string, { text: string; detail: string }> = {
  'Root Knot Nematode': {
    text: 'Neem cake 500g/sqm',
    detail: 'Kills nematode larvae in top 10cm.',
  },
  'Fusarium Wilt': {
    text: 'Trichoderma viride 5g/sqm',
    detail: 'Beneficial fungus outcompetes Fusarium in soil.',
  },
  'Bacterial Wilt': {
    text: 'Lime 200g/sqm + remove infected soil 5cm',
    detail: 'Raises pH, suppresses bacterial wilt pathogens.',
  },
  'White Grubs': {
    text: 'Neem cake 500g/sqm + Beauveria bassiana',
    detail: 'Biological control for white grub larvae.',
  },
};

function isVirginOrFallow(prevCropSeason: string | null): boolean {
  if (!prevCropSeason) return true;
  const low = prevCropSeason.toLowerCase();
  return (
    low.includes('fallow') ||
    low.includes('virgin') ||
    low.includes('coconut') ||
    low.includes('garden') ||
    low.includes('unused')
  );
}

export function getSoilPrepSteps(params: SoilPrepParams): PrepStep[] {
  const { soil_type, prev_crop_family, prev_crop_season, pest_history, currentMonth } = params;

  const steps: PrepStep[] = [];
  let stepNum = 1;

  // Steps 1–3: soil-type base prep
  const baseSteps = SOIL_BASE_STEPS[soil_type] ?? SOIL_BASE_STEPS.garden_soil ?? [];
  for (const s of baseSteps) {
    steps.push({ number: String(stepNum++), text: s.text, detail: s.detail });
  }

  // Step "3c" (contextual): green manure if virgin/fallow land or no previous crop
  if (isVirginOrFallow(prev_crop_season) || prev_crop_family === null) {
    const gm = getGreenManureForMonth(currentMonth);
    steps.push({
      number: `${stepNum - 1}c`,
      text: `${gm.name} green manure first`,
      detail: prev_crop_season
        ? `Land was previously ${prev_crop_season.toLowerCase()}. One 6-week ${gm.name.toLowerCase()} cycle builds soil biology before first vegetable crop.`
        : `No previous crop recorded. One 6-week ${gm.name.toLowerCase()} cycle establishes soil biology.`,
    });
  }

  // Step 4: rest period
  const restInfo = prev_crop_family
    ? REST_BY_PREV_CROP[prev_crop_family] ?? REST_BY_PREV_CROP.other
    : null;

  if (restInfo) {
    const hasGreenManure = isVirginOrFallow(prev_crop_season) || prev_crop_family === null;
    const restText = hasGreenManure
      ? `Rest 6 weeks (green manure) then ${restInfo.days}`
      : `Rest ${restInfo.days}`;
    steps.push({
      number: String(stepNum++),
      text: restText,
      detail: `Let soil biology activate before planting — ${restInfo.reason}.`,
    });
  } else {
    // Virgin land with green manure — rest is baked into the green manure cycle
    steps.push({
      number: String(stepNum++),
      text: 'Rest 6 weeks (green manure) then 10 days',
      detail: 'Let soil biology activate before planting.',
    });
  }

  // Final step: mulch
  steps.push({
    number: String(stepNum),
    text: 'Mulch 15cm',
    detail: 'Paddy straw or coconut frond pieces — keeps moisture and suppresses weeds.',
  });

  // Append pest-history extras (no step numbers — flagged entries)
  for (const record of pest_history) {
    const extra = PEST_ADDITIONS[record.pest_name];
    if (extra) {
      steps.push({ number: '⚠', text: extra.text, detail: extra.detail });
    }
  }

  return steps;
}

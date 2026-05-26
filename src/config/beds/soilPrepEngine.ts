import type { SoilType, CropFamily, PestHistoryItem, BedType } from '@/types/database.types';
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
  bed_type?: BedType | null;
}

const SOIL_BASE_STEPS: Partial<Record<SoilType, { text: string; detail: string }[]>> = {
  red_laterite: [
    { text: 'Dig 45cm once', detail: 'Break laterite hardpan. Never dig again after this.' },
    {
      text: 'Coir pith compost 4kg/sqm',
      detail: 'Dramatically improves water retention in laterite.',
    },
    { text: 'Lasagne layers', detail: 'Dry leaves 5cm → compost 10cm → topsoil mix.' },
  ],
  alluvial: [
    {
      text: 'Fork top 20cm',
      detail: 'Alluvial soil is already loose — light pass is enough, no deep breaking needed.',
    },
    {
      text: 'Compost 1kg/sqm',
      detail: 'Alluvial is naturally fertile; light organic top-up maintains soil biology.',
    },
    {
      text: 'Level and water 2 days before planting',
      detail: 'Settles the bed and activates soil microbes.',
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
  coco_peat: [
    {
      text: 'No digging needed',
      detail: 'Coco peat is already loose — just top-dress and prepare the surface.',
    },
    {
      text: 'Top-dress 2cm compost + 50g neem cake/sqm',
      detail: 'Adds nutrients and suppresses soil pests in the growing medium.',
    },
    {
      text: 'Wet thoroughly 2 days before planting',
      detail: 'Coco peat must be fully saturated before transplanting or sowing.',
    },
  ],
};

const REST_BY_PREV_CROP: Record<string, { days: string; reason: string }> = {
  solanaceae: { days: '14 days', reason: 'clear solanaceae soil pathogens' },
  cucurbit: { days: '10 days', reason: 'remove vine debris and reset fungal load' },
  brassica: { days: '7 days', reason: 'brassica debris mildly inhibits next planting' },
  allium: { days: '14 days', reason: 'allium residue inhibits legume germination' },
  legume: { days: '3 days', reason: 'excellent rotation — minimal rest needed' },
  other: { days: '5 days', reason: 'standard rest between crop families' },
};

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

const DRAINAGE_BED_TYPES: BedType[] = ['spice', 'root_legume'];

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
  const { soil_type, prev_crop_family, prev_crop_season, pest_history, currentMonth, bed_type } =
    params;

  const steps: PrepStep[] = [];
  let stepNum = 1;

  // Steps 1–3: soil-type base prep
  const baseSteps = SOIL_BASE_STEPS[soil_type] ?? SOIL_BASE_STEPS.garden_soil ?? [];
  for (const s of baseSteps) {
    steps.push({ number: String(stepNum++), text: s.text, detail: s.detail });
  }

  // Bed-type drainage reminder for crops sensitive to waterlogging
  if (bed_type && DRAINAGE_BED_TYPES.includes(bed_type)) {
    steps.push({
      number: String(stepNum++),
      text: 'Ensure drainage channel',
      detail:
        'Ginger, turmeric, carrot and groundnut rot in waterlogged soil — slope bed or add gravel sub-layer.',
    });
  }

  // Contextual: green manure if virgin/fallow land or no previous crop
  if (isVirginOrFallow(prev_crop_season) || prev_crop_family === null) {
    const gm = getGreenManureForMonth(currentMonth);
    steps.push({
      number: String(stepNum++),
      text: `${gm.name} green manure first`,
      detail: prev_crop_season
        ? `Land was previously ${prev_crop_season.toLowerCase()}. One 6-week ${gm.name.toLowerCase()} cycle builds soil biology before first vegetable crop.`
        : `No previous crop recorded. One 6-week ${gm.name.toLowerCase()} cycle establishes soil biology.`,
    });
  }

  // Rest period
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

  // Pest-history warnings (flagged entries, no sequence number)
  for (const record of pest_history) {
    const extra = PEST_ADDITIONS[record.pest_name];
    if (extra) {
      steps.push({ number: '⚠', text: extra.text, detail: extra.detail });
    }
  }

  return steps;
}

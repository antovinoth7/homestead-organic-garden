import { CropFamily, PestHistoryItem } from '@/types/database.types';

// fromFamily → toFamily → soil preparation steps
const TRANSITION_MATRIX: Partial<Record<CropFamily, Partial<Record<CropFamily, string[]>>>> = {
  solanaceae: {
    legume: [
      'Rest bed 14 days',
      'Apply 2 kg compost per sqm',
      'Sow green manure (Cowpea) 3 weeks before transplant',
      'Lime if soil pH < 6.0',
    ],
    brassica: [
      'Rest bed 21 days',
      'Apply 3 kg compost per sqm',
      'Check for solanum wilt in soil — treat with Jeevamrutha',
    ],
    cucurbit: [
      'Rest bed 14 days',
      'Apply 2 kg compost per sqm',
      'Mulch heavily to suppress solanaceae pathogens',
    ],
    allium: [
      'Rest bed 10 days',
      'Apply neem cake (200 g/sqm)',
      'Alliums suppress solanaceae soil pathogens',
    ],
    other: ['Rest bed 14 days', 'Apply 2 kg compost per sqm'],
  },
  cucurbit: {
    legume: [
      'Apply 1 kg compost per sqm',
      'Sow green manure before next planting',
      'Remove all vine debris thoroughly',
    ],
    solanaceae: [
      'Remove all vine debris',
      'Apply 2 kg compost per sqm',
      'Check for cucumber mosaic virus residue',
    ],
    brassica: ['Apply 1 kg compost per sqm', 'Remove all vine debris', 'Apply lime if pH < 6.5'],
    other: ['Remove all vine debris', 'Apply 1 kg compost per sqm'],
  },
  legume: {
    solanaceae: [
      'Do NOT add nitrogen fertiliser — legumes leave surplus N',
      'Apply 1 kg compost only',
      'Excellent rotation for heavy-feeding fruiting crops',
    ],
    brassica: ['Apply phosphorus (rock phosphate 100 g/sqm)', 'Legume N benefits brassicas'],
    cucurbit: ['Excellent rotation — legume N feeds cucurbits well', 'Apply 1 kg compost per sqm'],
    other: ['Excellent rotation — legume N enriches soil'],
  },
  brassica: {
    legume: [
      'Apply 1 kg compost per sqm',
      'Rest 7 days — brassica residue mild inhibitor for some legumes',
    ],
    solanaceae: ['Apply 2 kg compost per sqm', 'Check clubroot risk — lime if pH < 6.5'],
    cucurbit: ['Apply 1 kg compost per sqm', 'Remove all brassica debris before planting'],
    other: ['Remove brassica debris', 'Apply 1 kg compost per sqm'],
  },
  allium: {
    legume: [
      'Alliums inhibit legume growth — rest 14 days',
      'Apply 2 kg compost per sqm',
      'Water well before planting beans',
    ],
    other: ['Rest 7 days', 'Apply 1 kg compost per sqm'],
  },
};

const DEFAULT_TRANSITION: string[] = [
  'Apply 1–2 kg compost per sqm',
  'Water bed 2 days before transplanting',
];

const PEST_HISTORY_ADDITIONS: Record<string, string[]> = {
  'Root Knot Nematode': [
    'Apply neem cake (500 g/sqm)',
    'Sow Marigold as trap crop before planting',
  ],
  'Fusarium Wilt': [
    'Apply Trichoderma viride (5 g/sqm)',
    'Avoid waterlogging',
    'Use Panchagavya soil drench',
  ],
  'Bacterial Wilt': [
    'Remove infected soil 5 cm deep',
    'Apply lime (200 g/sqm)',
    'Avoid overhead irrigation',
  ],
  'White Grubs': [
    'Apply neem cake (500 g/sqm)',
    'Hand-pick during bed preparation',
    'Apply Beauveria bassiana',
  ],
};

export function getTransitionInputs(
  fromFamily: CropFamily,
  toFamily: CropFamily,
  pestHistory: PestHistoryItem[]
): string[] {
  const base =
    TRANSITION_MATRIX[fromFamily]?.[toFamily] ??
    TRANSITION_MATRIX[fromFamily]?.['other'] ??
    DEFAULT_TRANSITION;

  const additions: string[] = [];
  for (const record of pestHistory) {
    const extra = PEST_HISTORY_ADDITIONS[record.pest_name];
    if (extra) {
      additions.push(...extra.filter((step) => !base.includes(step)));
    }
  }

  return [...base, ...additions];
}

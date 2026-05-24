export interface DynamicAccumulator {
  name: string;
  tamilName: string;
  chop_drop_interval_days: number;
  nutrients_mined: string[];
  description: string;
}

export const DYNAMIC_ACCUMULATORS: DynamicAccumulator[] = [
  {
    name: 'Agathi',
    tamilName: 'அகத்தி',
    chop_drop_interval_days: 45,
    nutrients_mined: ['Nitrogen', 'Calcium', 'Iron'],
    description: 'Fast-growing nitrogen-fixer. Chop stems at 45-day intervals; leaves are edible.',
  },
  {
    name: 'Moringa',
    tamilName: 'முருங்கை',
    chop_drop_interval_days: 90,
    nutrients_mined: ['Nitrogen', 'Phosphorus', 'Potassium', 'Calcium', 'Magnesium'],
    description:
      'Deep-rooted accumulator of macro and micro nutrients. Prune heavily every 90 days.',
  },
  {
    name: 'Comfrey',
    tamilName: 'கம்ப்ரி',
    chop_drop_interval_days: 60,
    nutrients_mined: ['Potassium', 'Phosphorus', 'Calcium', 'Silicon'],
    description: 'Potassium powerhouse. Leaves decompose rapidly; ideal mulch layer activator.',
  },
  {
    name: 'Banana',
    tamilName: 'வாழை',
    chop_drop_interval_days: 180,
    nutrients_mined: ['Potassium', 'Calcium', 'Magnesium'],
    description: 'After harvest, chop entire pseudostem into bed — provides potassium-rich mulch.',
  },
];

export function getAccumulatorByName(name: string): DynamicAccumulator | undefined {
  return DYNAMIC_ACCUMULATORS.find((a) => a.name.toLowerCase() === name.toLowerCase());
}

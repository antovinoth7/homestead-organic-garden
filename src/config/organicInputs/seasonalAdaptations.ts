/**
 * Pre-monsoon batch tasks for Kanyakumari / Tamil Nadu organic farming — the
 * preparation list `getPreMonsoonTasks` (`utils/preMonsoonTasks.ts`) returns in
 * the three weeks before SW Monsoon onset. Built and tested but not yet shown
 * on any screen; see docs/IMPLEMENTATION_ROADMAP.md §9.
 */

export interface PreMonsoonTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'bed_prep' | 'input' | 'infrastructure' | 'planting';
}

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

import { Ionicons } from '@expo/vector-icons';
import { TaskType } from '../types/database.types';

export const TASK_DUE_TIME_HOUR = 18; // 6:00 PM
export const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Task types where doing the work early is actively harmful rather than merely
 * off-schedule, so completing them before they are due is refused outright.
 * Every other type is only warned about. The keys *are* the blocked set, so the
 * list and the explanations can never drift apart.
 */
export const EARLY_COMPLETION_BLOCK_REASON: Partial<Record<TaskType, string>> = {
  water: 'Watering early risks overwatering and root rot.',
  fertilise: 'Fertilising early risks nutrient burn.',
  spray: 'Spraying early means overuse and a shorter pre-harvest interval.',
};

export const TASK_EMOJIS: Record<TaskType, string> = {
  water: '💧',
  fertilise: '🌿',
  prune: '✂️',
  repot: '🪴',
  spray: '💨',
  mulch: '🍂',
  harvest: '🧺',
  harvest_leaves: '🍃',
  weeding: '🌾',
  transplanting: '🌱',
  cultivating: '⛏️',
};

export const TASK_COLORS: Record<TaskType, string> = {
  water: '#2196F3',
  fertilise: '#FF9800',
  prune: '#9C27B0',
  repot: '#4CAF50',
  spray: '#00BCD4',
  mulch: '#795548',
  harvest: '#8BC34A',
  harvest_leaves: '#66BB6A',
  weeding: '#7CB342',
  transplanting: '#26A69A',
  cultivating: '#8D6E63',
};

/**
 * Lightened variants of TASK_COLORS for use on the dark-green dashboard hero.
 * The base palette is tuned for white cards — `mulch` (#795548) and
 * `cultivating` (#8D6E63) in particular disappear against deep green — so the
 * hero uses these instead. Hues are kept, only lightness is raised.
 */
export const TASK_COLORS_ON_DARK: Record<TaskType, string> = {
  water: '#90CAF9',
  fertilise: '#FFCC80',
  prune: '#CE93D8',
  repot: '#81C784',
  spray: '#80DEEA',
  mulch: '#BCAAA4',
  harvest: '#DCE775',
  harvest_leaves: '#A5D6A7',
  weeding: '#C5E1A5',
  transplanting: '#80CBC4',
  cultivating: '#D7CCC8',
};

export const TASK_ICONS: Record<TaskType, keyof typeof Ionicons.glyphMap> = {
  water: 'water',
  fertilise: 'nutrition',
  prune: 'cut',
  repot: 'move',
  spray: 'sparkles',
  mulch: 'layers',
  harvest: 'basket',
  harvest_leaves: 'leaf',
  weeding: 'trash-bin',
  transplanting: 'swap-horizontal',
  cultivating: 'build',
};

/**
 * The same work named as an activity rather than a command. `TASK_LABELS` is
 * imperative ("Water", "Spray"), which reads wrong as the subject of a sentence
 * — "Water on Bed 3 is 5 days late" states the wrong thing. Used by the Today
 * screen's plot line.
 */
export const TASK_GERUNDS: Record<TaskType, string> = {
  water: 'Watering',
  fertilise: 'Fertilising',
  prune: 'Pruning',
  repot: 'Repotting',
  spray: 'Spraying',
  mulch: 'Mulching',
  harvest: 'Harvesting',
  harvest_leaves: 'Leaf harvest',
  weeding: 'Weeding',
  transplanting: 'Transplanting',
  cultivating: 'Cultivating',
};

export const TASK_LABELS: Record<TaskType, string> = {
  water: 'Water',
  fertilise: 'Fertilise',
  prune: 'Prune',
  repot: 'Repot',
  spray: 'Spray',
  mulch: 'Mulch',
  harvest: 'Harvest',
  harvest_leaves: 'Harvest Leaves',
  weeding: 'Weeding',
  transplanting: 'Transplanting',
  cultivating: 'Cultivating',
};

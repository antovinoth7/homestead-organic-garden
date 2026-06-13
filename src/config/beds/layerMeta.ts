import type { BedLayer } from '@/types/database.types';
import type { Theme } from '@/theme/colors';

export const LAYER_ORDER: BedLayer[] = [
  'canopy',
  'climber',
  'understory',
  'root',
  'ground_cover',
];

// Theme-independent layer metadata. Layer accent/background colors live on the
// theme (`theme.layerColors`) so they adapt to light/dark mode — see colors.ts.
export interface LayerMetaEntry {
  icon: string;
  title: string;
  subtitle: string;
}

export const LAYER_META: Record<BedLayer, LayerMetaEntry> = {
  canopy: {
    icon: '🌳',
    title: 'Tall / Shade Trees',
    subtitle: 'Largest plants — provide shade and vertical support',
  },
  climber: {
    icon: '🌿',
    title: 'Trellis Crops',
    subtitle: 'Vines growing up a trellis or support frame',
  },
  understory: {
    icon: '🌱',
    title: 'Main Crops',
    subtitle: 'Primary income crops at mid height',
  },
  root: {
    icon: '🥕',
    title: 'Underground Crops',
    subtitle: 'Root and tuber crops grown below ground',
  },
  ground_cover: {
    icon: '🌸',
    title: 'Border & Mulch Plants',
    subtitle: 'Companion plants at bed edges — suppress weeds and pests',
  },
};

export const getLayerColor = (theme: Theme, layer: BedLayer): string =>
  theme.layerColors[layer].color;

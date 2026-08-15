import type { BedLayer } from '@/types/database.types';
import type { Theme } from '@/theme/colors';
import type { VisualIconKey } from '@/types/visual.types';

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
  iconKey: VisualIconKey;
  title: string;
  subtitle: string;
}

export const LAYER_META: Record<BedLayer, LayerMetaEntry> = {
  canopy: {
    iconKey: 'layer.canopy',
    title: 'Tall / Shade Trees',
    subtitle: 'Largest plants — provide shade and vertical support',
  },
  climber: {
    iconKey: 'layer.climber',
    title: 'Trellis Crops',
    subtitle: 'Vines growing up a trellis or support frame',
  },
  understory: {
    iconKey: 'layer.understory',
    title: 'Main Crops',
    subtitle: 'Primary income crops at mid height',
  },
  root: {
    iconKey: 'layer.root',
    title: 'Underground Crops',
    subtitle: 'Root and tuber crops grown below ground',
  },
  ground_cover: {
    iconKey: 'layer.ground_cover',
    title: 'Border & Mulch Plants',
    subtitle: 'Companion plants at bed edges — suppress weeds and pests',
  },
};

export const getLayerColor = (theme: Theme, layer: BedLayer): string =>
  theme.layerColors[layer].color;

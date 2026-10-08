import type { BedLayer } from '@/types/database.types';
import type { Theme } from '@/theme/colors';

export const LAYER_ORDER: BedLayer[] = [
  'canopy',
  'climber',
  'understory',
  'root',
  'ground_cover',
];

// Layer accent/background colors live on the theme (`theme.layerColors`) so they
// adapt to light/dark mode — see colors.ts.
export const getLayerColor = (theme: Theme, layer: BedLayer): string =>
  theme.layerColors[layer].color;

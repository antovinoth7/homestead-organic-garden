import type { BedLayer } from '@/types/database.types';

export const LAYER_ORDER: BedLayer[] = [
  'canopy',
  'climber',
  'understory',
  'root',
  'ground_cover',
];

export interface LayerMetaEntry {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  bg: string;
}

export const LAYER_META: Record<BedLayer, LayerMetaEntry> = {
  canopy: {
    icon: '🌳',
    title: 'Tall / Shade Trees',
    subtitle: 'Largest plants — provide shade and vertical support',
    color: '#2e7d32',
    bg: '#f1f8f1',
  },
  climber: {
    icon: '🌿',
    title: 'Trellis Crops',
    subtitle: 'Vines growing up a trellis or support frame',
    color: '#7b1fa2',
    bg: '#f5f0fa',
  },
  understory: {
    icon: '🌱',
    title: 'Main Crops',
    subtitle: 'Primary income crops at mid height',
    color: '#558b2f',
    bg: '#f4f8ee',
  },
  root: {
    icon: '🥕',
    title: 'Underground Crops',
    subtitle: 'Root and tuber crops grown below ground',
    color: '#e65100',
    bg: '#fff8f0',
  },
  ground_cover: {
    icon: '🌸',
    title: 'Border & Mulch Plants',
    subtitle: 'Companion plants at bed edges — suppress weeds and pests',
    color: '#c8842a',
    bg: '#fdf5e8',
  },
};

export const getLayerColor = (layer: BedLayer): string => LAYER_META[layer].color;

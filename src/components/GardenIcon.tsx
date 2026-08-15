import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ICON_REGISTRY } from '@/config/iconRegistry';
import type { BedType } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';

interface Props {
  name: VisualIconKey;
  size: number;
  color: string;
  accessibilityLabel?: string;
}

interface BedGlyphProps {
  bedType: BedType;
  size: number;
  color: string;
  accessibilityLabel?: string;
}

/** Seven compact, single-stroke bed marks for concepts absent from Ionicons. */
function BedGlyph({ bedType, size, color, accessibilityLabel }: BedGlyphProps): React.JSX.Element {
  const common = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
    >
      <Rect x="3" y="5" width="18" height="14" rx="3" fill="none" {...common} />
      {bedType === 'leafy' && (
        <>
          <Path d="M7 15c0-4 2-6 5-7 0 4-1 7-5 7Z" fill="none" {...common} />
          <Path d="M12 16c0-3 2-5 5-6 0 3-1 6-5 6Z" fill="none" {...common} />
        </>
      )}
      {bedType === 'fruiting' && (
        <>
          <Circle cx="9" cy="13" r="2.2" fill="none" {...common} />
          <Circle cx="15" cy="13" r="2.2" fill="none" {...common} />
          <Path d="M9 10 8 8m7 2 1-2" fill="none" {...common} />
        </>
      )}
      {bedType === 'spice' && (
        <>
          <Path d="M7 16c1-5 4-7 9-8-1 5-4 8-9 8Z" fill="none" {...common} />
          <Line x1="9" y1="14" x2="15" y2="9" {...common} />
        </>
      )}
      {bedType === 'root_legume' && (
        <>
          <Path d="M9 8c-2 2-2 4 0 7l3 2 3-2c2-3 2-5 0-7" fill="none" {...common} />
          <Path d="m9 8 3 2 3-2" fill="none" {...common} />
        </>
      )}
      {bedType === 'climber_trellis' && (
        <>
          <Path d="M7 17V8m10 9V8M7 10h10m-5 7c0-4 2-6 5-7" fill="none" {...common} />
          <Circle cx="12" cy="14" r="1" fill={color} />
        </>
      )}
      {bedType === 'three_sisters' && (
        <>
          <Path d="M8 16V9m4 7V7m4 9v-5" fill="none" {...common} />
          <Path d="m6 11 2-2 2 2m0-2 2-2 2 2m0 4 2-2 2 2" fill="none" {...common} />
        </>
      )}
      {bedType === 'medicinal_guild' && (
        <>
          <Circle cx="12" cy="12" r="2" fill="none" {...common} />
          <Path d="M12 8V7m0 10v-1m4-4h1M7 12h1m6.8-2.8.8-.8M8.4 15.6l.8-.8" fill="none" {...common} />
        </>
      )}
    </Svg>
  );
}

/** Resolves semantic garden artwork without leaking icon-library names into domain code. */
export function GardenIcon({ name, size, color, accessibilityLabel }: Props): React.JSX.Element {
  const definition = ICON_REGISTRY[name];
  if (definition.kind === 'bed') {
    return (
      <BedGlyph
        bedType={definition.bedType}
        size={size}
        color={color}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }
  return (
    <Ionicons
      name={definition.name}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
    />
  );
}


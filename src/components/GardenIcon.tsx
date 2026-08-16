import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { ICON_REGISTRY } from '@/config/iconRegistry';
import type { CustomPlantIconType } from '@/config/iconRegistry';
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

interface PlantTypeGlyphProps {
  plantType: CustomPlantIconType;
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
          <Path
            d="M12 8V7m0 10v-1m4-4h1M7 12h1m6.8-2.8.8-.8M8.4 15.6l.8-.8"
            fill="none"
            {...common}
          />
        </>
      )}
    </Svg>
  );
}

/** Compact plant silhouettes for categories without a clear Ionicons metaphor. */
function PlantTypeGlyph({
  plantType,
  size,
  color,
  accessibilityLabel,
}: PlantTypeGlyphProps): React.JSX.Element {
  const common = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!accessibilityLabel}
    >
      {plantType === 'vegetable' && (
        <>
          <Path
            d="M8.5 9.5c1.8-1.2 5.2-1.2 7 0L13 20c-.3 1.3-1.7 1.3-2 0L8.5 9.5Z"
            fill="none"
            {...common}
          />
          <Path
            d="M12 8C10.5 4.5 8.2 4 6.5 4.2 7 6.8 8.8 8 12 8Zm0 0c1-3.3 3-4.5 5.5-4.5-.2 2.8-2.1 4.5-5.5 4.5Z"
            fill="none"
            {...common}
          />
        </>
      )}
      {plantType === 'spinach' && (
        <>
          <Path d="M12 20V9" fill="none" {...common} />
          <Path d="M12 13C7.5 13 5 10.8 5 7c4.2 0 7 1.8 7 6Z" fill="none" {...common} />
          <Path d="M12 10c0-4 2.8-6 7-6 0 3.8-2.5 6-7 6Z" fill="none" {...common} />
          <Path d="M12 17c3.5 0 5.5-1.7 5.5-4.5-3.3 0-5.5 1.4-5.5 4.5Z" fill="none" {...common} />
        </>
      )}
      {plantType === 'coconut_tree' && (
        <>
          <Path d="M11 21c1-6 1.5-10.5 1-14" fill="none" {...common} />
          <Path
            d="M12 7C9.5 4.2 7 4 4.5 5m7.5 2C9 6.8 7 8 5.5 10m6.5-3c1.8-3 4.3-4 7-3m-7 3c3-.5 5.2.5 7 2.5m-7-2c.2-2.6-.7-4.3-2-5.5"
            fill="none"
            {...common}
          />
          <Circle cx="10.5" cy="8" r="1" fill="none" {...common} />
          <Path d="M7 21h8" fill="none" {...common} />
        </>
      )}
      {plantType === 'timber_tree' && (
        <>
          <Path
            d="M8.5 18h7M10 18v-4.2C7.2 13.5 5 11.3 5 8.5 5 5.5 7.4 3 10.5 3c.5 0 1 .1 1.5.3.7-.5 1.6-.8 2.5-.8 2.5 0 4.5 2 4.5 4.5 0 .6-.1 1.2-.4 1.8.9.8 1.4 1.9 1.4 3.2 0 2.2-1.8 4-4 4-.7 0-1.4-.2-2-.5V18"
            fill="none"
            {...common}
          />
          <Path d="M12 14V9m0 4-2-2m2 1 2.5-2.5" fill="none" {...common} />
          <Path d="M7 21h10" fill="none" {...common} />
        </>
      )}
      {plantType === 'shrub' && (
        <>
          <Path
            d="M4 17c-1-2.6.4-5.4 3-6.2C7.2 8.1 9.4 6 12.2 6c2.6 0 4.8 1.8 5.3 4.3 2 .5 3.5 2.3 3.5 4.5 0 .8-.2 1.5-.6 2.2H4Z"
            fill="none"
            {...common}
          />
          <Path d="M8 17v3m8-3v3M5.5 20h13" fill="none" {...common} />
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
  if (definition.kind === 'plant') {
    return (
      <PlantTypeGlyph
        plantType={definition.plantType}
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

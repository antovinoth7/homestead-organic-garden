import React, { useMemo, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import type {
  PanGestureHandlerEventPayload,
  HandlerStateChangeEvent,
  GestureEvent,
} from 'react-native-gesture-handler';
import Svg, { Rect, Circle, Text as SvgText, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { autoArrangePlants, getPlantRadius } from '@/utils/bedLayoutEngine';
import { createStyles } from '@/styles/bedDiagramStyles';
import type { Bed, BedLayer, BedPosition, Plant } from '@/types/database.types';

interface Props {
  bed: Bed;
  plants: Plant[];
  onPositionChange?: (plantId: string, pos: BedPosition) => void;
  onResetLayout?: () => void;
}

const SVG_WIDTH = 300;
const SVG_PADDING = 16;

const LAYER_COLORS: Record<BedLayer, string> = {
  canopy: '#4caf50',
  understory: '#8bc34a',
  ground_cover: '#a67b5b',
  root: '#ff9800',
  climber: '#9c27b0',
};

const LAYER_LABELS: Record<BedLayer, string> = {
  canopy: 'Canopy',
  understory: 'Understory',
  ground_cover: 'Ground Cover',
  root: 'Root',
  climber: 'Climber',
};

const localStyles = StyleSheet.create({
  plantCircleBase: { position: 'absolute' },
});
const { plantCircleBase } = localStyles;

function DraggablePlant({
  plantId,
  plantName,
  layer,
  cx,
  cy,
  radius,
  svgWidth,
  svgHeight,
  onPositionChange,
}: {
  plantId: string;
  plantName: string;
  layer: BedLayer;
  cx: number;
  cy: number;
  radius: number;
  svgWidth: number;
  svgHeight: number;
  onPositionChange?: (plantId: string, pos: BedPosition) => void;
}): React.JSX.Element {
  const offsetRef = useRef({ startX: cx, startY: cy });
  const color = LAYER_COLORS[layer];

  const circleStyle = useMemo(
    () => ({ left: cx - radius, top: cy - radius, width: radius * 2, height: radius * 2 }),
    [cx, cy, radius]
  );

  const onGestureEvent = useCallback((_event: GestureEvent<PanGestureHandlerEventPayload>) => {
    // Gesture tracking happens; final position is set on state end
  }, []);

  const onHandlerStateChange = useCallback(
    (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (event.nativeEvent.state === State.BEGAN) {
        offsetRef.current = { startX: cx, startY: cy };
      }
      if (event.nativeEvent.state === State.END && onPositionChange) {
        const { translationX, translationY } = event.nativeEvent;
        const newCx = offsetRef.current.startX + translationX;
        const newCy = offsetRef.current.startY + translationY;

        // Clamp to SVG bounds (with padding)
        const clampedX = Math.max(SVG_PADDING, Math.min(svgWidth - SVG_PADDING, newCx));
        const clampedY = Math.max(SVG_PADDING, Math.min(svgHeight - SVG_PADDING, newCy));

        // Convert to normalized 0–1
        const normalizedX = (clampedX - SVG_PADDING) / (svgWidth - 2 * SVG_PADDING);
        const normalizedY = (clampedY - SVG_PADDING) / (svgHeight - 2 * SVG_PADDING);

        onPositionChange(plantId, {
          x: Math.max(0, Math.min(1, normalizedX)),
          y: Math.max(0, Math.min(1, normalizedY)),
        });
      }
    },
    [cx, cy, plantId, svgWidth, svgHeight, onPositionChange]
  );

  const label = plantName.length > 6 ? plantName.slice(0, 5) + '..' : plantName;

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      minDist={5}
    >
      <View style={[plantCircleBase, circleStyle]}>
        <Svg width={radius * 2} height={radius * 2}>
          <Circle
            cx={radius}
            cy={radius}
            r={radius - 2}
            fill={color}
            opacity={0.7}
            stroke={color}
            strokeWidth={2}
          />
          <SvgText
            x={radius}
            y={radius + 3}
            fontSize={9}
            fill="#fff"
            fontWeight="600"
            textAnchor="middle"
          >
            {label}
          </SvgText>
        </Svg>
      </View>
    </PanGestureHandler>
  );
}

export function BedDiagram({
  bed,
  plants,
  onPositionChange,
  onResetLayout,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const bedWidthCm = bed.dimensions.width_m * 100;

  // Compute positions for all plants
  const positionMap = useMemo(() => autoArrangePlants(plants, bed), [plants, bed]);

  // Determine which layers are represented
  const activeLayers = useMemo(() => {
    const layers = new Set<BedLayer>();
    for (const plant of plants) {
      layers.add(plant.bed_layer ?? 'understory');
    }
    return Array.from(layers);
  }, [plants]);

  if (plants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="grid-outline" size={32} color={theme.textTertiary} />
        <Text style={styles.emptyText}>
          No plants in this bed yet.{'\n'}Add plants to see the layout diagram.
        </Text>
      </View>
    );
  }

  // Compute aspect ratio from bed dimensions
  const aspectRatio = bed.dimensions.width_m / bed.dimensions.length_m;
  const svgWidth = SVG_WIDTH;
  const svgHeight = Math.round(svgWidth / Math.max(0.5, Math.min(2, aspectRatio)));
  const drawWidth = svgWidth - 2 * SVG_PADDING;
  const drawHeight = svgHeight - 2 * SVG_PADDING;

  return (
    <View style={styles.container}>
      {/* Compass badge */}
      <View style={styles.compassBadge}>
        <Ionicons name="navigate-outline" size={12} color={theme.primary} />
        <Text style={styles.compassText}>N</Text>
      </View>

      {/* SVG bed + absolute-positioned draggable plants */}
      <View style={[styles.svgContainer, { height: svgHeight + 16 }]}>
        {/* Background SVG (bed outline + grid) */}
        <Svg width={svgWidth} height={svgHeight}>
          {/* Bed outline */}
          <Rect
            x={SVG_PADDING}
            y={SVG_PADDING}
            width={drawWidth}
            height={drawHeight}
            rx={4}
            ry={4}
            fill={theme.primaryLight}
            stroke={theme.border}
            strokeWidth={1.5}
          />
          {/* Center line (N-S) */}
          <Line
            x1={svgWidth / 2}
            y1={SVG_PADDING + 4}
            x2={svgWidth / 2}
            y2={svgHeight - SVG_PADDING - 4}
            stroke={theme.border}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        </Svg>

        {/* Draggable plant circles (absolute over SVG) */}
        {plants.map((plant) => {
          const pos = positionMap.get(plant.id);
          if (!pos) return null;
          const cx = SVG_PADDING + pos.x * drawWidth;
          const cy = SVG_PADDING + pos.y * drawHeight;
          const radius = getPlantRadius(plant.spacing_cm, bedWidthCm, svgWidth);
          const layer: BedLayer = plant.bed_layer ?? 'understory';

          return (
            <DraggablePlant
              key={plant.id}
              plantId={plant.id}
              plantName={plant.name}
              layer={layer}
              cx={cx}
              cy={cy}
              radius={radius}
              svgWidth={svgWidth}
              svgHeight={svgHeight}
              onPositionChange={onPositionChange}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {activeLayers.map((layer) => (
          <View key={layer} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: LAYER_COLORS[layer] }]} />
            <Text style={styles.legendText}>{LAYER_LABELS[layer]}</Text>
          </View>
        ))}
      </View>

      {/* Reset layout button */}
      {onResetLayout && (
        <TouchableOpacity style={styles.resetButton} onPress={onResetLayout}>
          <Ionicons name="refresh-outline" size={14} color={theme.primary} />
          <Text style={styles.resetText}>Reset layout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

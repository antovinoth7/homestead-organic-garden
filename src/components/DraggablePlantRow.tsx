import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView } from 'react-native';
import { LongPressGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import type {
  PanGestureHandlerEventPayload,
  GestureEvent,
  HandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import { useTheme } from '@/theme';
import { createStyles, TILE_STEP } from '@/styles/draggablePlantRowStyles';
import { computeTargetIndex } from '@/utils/dragRowMath';
import type { BedLayer, PlantEntry } from '@/types/database.types';

interface Props {
  layer: BedLayer;
  entries: PlantEntry[];
  onReorder: (layer: BedLayer, orderedIds: string[]) => void;
  renderTile: (entry: PlantEntry, isDragging: boolean) => React.ReactNode;
}

export function DraggablePlantRow({
  layer,
  entries,
  onReorder,
  renderTile,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<PlantEntry[]>(entries);
  const startIdxRef = useRef(0);
  const currentIdxRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const panRef = useRef(null);

  // Sync local order with incoming entries when not actively dragging
  useEffect(() => {
    if (draggingId === null) setLocalOrder(entries);
  }, [entries, draggingId]);

  const beginDrag = useCallback(
    (id: string): void => {
      const idx = localOrder.findIndex((e) => e.id === id);
      if (idx === -1) return;
      startIdxRef.current = idx;
      currentIdxRef.current = idx;
      translateX.setValue(0);
      setDraggingId(id);
    },
    [localOrder, translateX]
  );

  const handlePan = useCallback(
    (event: GestureEvent<PanGestureHandlerEventPayload>): void => {
      if (draggingId === null) return;
      const tx = event.nativeEvent.translationX;
      const target = computeTargetIndex(startIdxRef.current, tx, localOrder.length, TILE_STEP);
      if (target !== currentIdxRef.current) {
        const next = [...localOrder];
        const [item] = next.splice(currentIdxRef.current, 1);
        if (item) {
          next.splice(target, 0, item);
          currentIdxRef.current = target;
          setLocalOrder(next);
        }
      }
      // Visual offset compensates for the splice that just moved the tile's base position.
      translateX.setValue(tx - (currentIdxRef.current - startIdxRef.current) * TILE_STEP);
    },
    [draggingId, localOrder, translateX]
  );

  const handlePanState = useCallback(
    (event: HandlerStateChangeEvent<PanGestureHandlerEventPayload>): void => {
      const s = event.nativeEvent.state;
      if (s !== State.END && s !== State.CANCELLED && s !== State.FAILED) return;
      if (draggingId === null) return;
      const orderedIds = localOrder.map((e) => e.id);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        setDraggingId(null);
        onReorder(layer, orderedIds);
      });
    },
    [draggingId, layer, localOrder, onReorder, translateX]
  );

  return (
    <PanGestureHandler
      ref={panRef}
      enabled={draggingId !== null}
      onGestureEvent={handlePan}
      onHandlerStateChange={handlePanState}
    >
      <Animated.View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={draggingId === null}
          contentContainerStyle={styles.scrollContent}
        >
          {localOrder.map((entry) => {
            const isDragging = draggingId === entry.id;
            const wrapperStyle = isDragging
              ? [
                  styles.tileWrapper,
                  styles.tileWrapperDragging,
                  { transform: [{ translateX }, { scale: 1.05 }] },
                ]
              : styles.tileWrapper;
            return (
              <LongPressGestureHandler
                key={entry.id}
                minDurationMs={350}
                simultaneousHandlers={panRef}
                onActivated={() => beginDrag(entry.id)}
              >
                <Animated.View style={wrapperStyle}>{renderTile(entry, isDragging)}</Animated.View>
              </LongPressGestureHandler>
            );
          })}
        </ScrollView>
      </Animated.View>
    </PanGestureHandler>
  );
}

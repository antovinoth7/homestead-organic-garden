import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Modal,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PanGestureHandler,
  State,
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import type { HandlerStateChangeEvent } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import { computeInterleavedEastPositions } from '@/utils/rowLayoutEngine';
import type { BedRow } from '@/utils/rowLayoutEngine';
import type { BedLayer } from '@/types/database.types';

interface RowWarning {
  rowIndex: number;
  message: string;
}

interface BedTopDownMapProps {
  widthM: number;
  lengthM: number;
  rows: BedRow[];
  plantEmoji: (name: string) => string;
  layerColor: (layer: BedLayer) => string;
  walkingPathCm?: number;
  edgeBufferCm?: number;
  overflowCm?: number;
  rowWarnings?: RowWarning[];
}

// Truncate species name to fit under the pin without wrapping.
function shortLabel(name: string): string {
  return name.length > 7 ? `${name.slice(0, 6)}…` : name;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const LABEL_VISIBLE_SCALE = 1.2;
// Inline: tdmCard.padding (10) ×2 + tdmRuler.width (26) + tdmMapWrap.gap (6)
const HORIZONTAL_OVERHEAD = 10 * 2 + 26 + 6;
// Modal: tdmModalCanvasWrap.padding (12) + tdmRuler.width (26) + tdmMapWrap.gap (6)
const MODAL_HORIZONTAL_OVERHEAD = 12 * 2 + 26 + 6;
// Modal vertical chrome around the canvas: header (~52), compass top+bottom (~58),
// legend (~36), wrap padding (~24).
const MODAL_VERTICAL_CHROME = 170;

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

interface CanvasProps extends BedTopDownMapProps {
  mapWidth: number;
  frameHeightCap: number;
  onExpand?: () => void;
}

interface CanvasGestureWrapProps {
  isInlinePreview: boolean;
  onExpand?: () => void;
  onPinchEvent: ReturnType<typeof Animated.event>;
  onPinchStateChange: (e: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => void;
  onPanEvent: ReturnType<typeof Animated.event>;
  onPanStateChange: (e: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => void;
  panEnabled: boolean;
  children: React.ReactNode;
}

// Inline preview is a tap-to-expand button; fullscreen uses the v1 pinch/pan
// handlers (which work without reanimated). The handler refs are local because
// they are only needed to cross-reference the two gestures as simultaneous.
function CanvasGestureWrap({
  isInlinePreview,
  onExpand,
  onPinchEvent,
  onPinchStateChange,
  onPanEvent,
  onPanStateChange,
  panEnabled,
  children,
}: CanvasGestureWrapProps): React.JSX.Element {
  const pinchRef = useRef(null);
  const panRef = useRef(null);

  if (isInlinePreview) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onExpand}
        accessibilityLabel="Open fullscreen map"
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <PanGestureHandler
      ref={panRef}
      onGestureEvent={onPanEvent}
      onHandlerStateChange={onPanStateChange}
      simultaneousHandlers={[pinchRef]}
      minPointers={1}
      maxPointers={1}
      enabled={panEnabled}
    >
      <Animated.View collapsable={false}>
        <PinchGestureHandler
          ref={pinchRef}
          onGestureEvent={onPinchEvent}
          onHandlerStateChange={onPinchStateChange}
          simultaneousHandlers={[panRef]}
        >
          <Animated.View collapsable={false}>{children}</Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

function BedTopDownCanvas({
  widthM,
  lengthM,
  rows,
  plantEmoji,
  layerColor,
  walkingPathCm = 60,
  edgeBufferCm = 0,
  overflowCm = 0,
  rowWarnings = [],
  mapWidth,
  frameHeightCap,
  onExpand,
}: CanvasProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const pinScale = clamp(mapWidth / 360, 0.9, 1.5);
  const pinSize = Math.round(22 * pinScale);
  const pinEmojiSize = Math.round(11 * pinScale);
  const pinLabelSize = Math.max(6, Math.round(7 * pinScale));
  const gapCaretSize = Math.max(6, Math.round(7 * pinScale));
  const pinWrapWidth = pinSize + 10;

  const widthCm = Math.max(1, Math.round(widthM * 100));
  const lengthCm = Math.max(1, Math.round(lengthM * 100));

  const rulerTicks = useMemo<number[]>(() => {
    const ticks: number[] = [];
    for (let m = 0; m <= lengthM + 1e-6; m += 0.5) {
      ticks.push(Math.round(m * 10) / 10);
    }
    return ticks;
  }, [lengthM]);

  const gridColCount = Math.max(0, Math.floor((widthCm - 1) / 30));
  const gridRowCount = Math.max(0, Math.floor((lengthCm - 1) / 30));

  const pathPct = Math.min(50, (walkingPathCm / lengthCm) * 100);
  const edgePctH = edgeBufferCm > 0 ? (edgeBufferCm / lengthCm) * 100 : 0;

  const rawAspect = widthM / lengthM;
  const clampedAspect = clamp(rawAspect, 0.4, 3);
  const responsiveMinHeight = clamp(mapWidth / clampedAspect, 180, frameHeightCap);

  const warningByRow = useMemo(() => {
    const map = new Map<number, string>();
    for (const w of rowWarnings) map.set(w.rowIndex, w.message);
    return map;
  }, [rowWarnings]);

  const mainCount = useMemo(
    () => rows.reduce((sum, r) => sum + r.plants.filter((p) => p.isCompanion !== true).length, 0),
    [rows]
  );
  const companionCount = useMemo(
    () => rows.reduce((sum, r) => sum + r.plants.filter((p) => p.isCompanion === true).length, 0),
    [rows]
  );

  // ── Pinch + pan state (v1 gesture-handler API — works without reanimated) ──
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const composedScale = useRef(Animated.multiply(baseScale, pinchScale)).current;
  const lastScale = useRef(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const frameSize = useRef({ width: 0, height: 0 });
  const [currentScale, setCurrentScale] = useState(1);
  const [hintDismissed, setHintDismissed] = useState(false);

  const clampOffset = useCallback(
    (x: number, y: number, s: number): { x: number; y: number } => {
      const maxTx = (frameSize.current.width * (s - 1)) / 2;
      const maxTy = (frameSize.current.height * (s - 1)) / 2;
      return { x: clamp(x, -maxTx, maxTx), y: clamp(y, -maxTy, maxTy) };
    },
    []
  );

  // Re-establish the offset model (offset = position, value = 0) so subsequent
  // pans accumulate correctly from the committed position.
  const settleOffset = useCallback(
    (x: number, y: number) => {
      lastOffset.current = { x, y };
      translateX.setOffset(x);
      translateX.setValue(0);
      translateY.setOffset(y);
      translateY.setValue(0);
    },
    [translateX, translateY]
  );

  const applyLabelOpacity = useCallback(
    (s: number) => {
      labelOpacity.setValue(s >= LABEL_VISIBLE_SCALE ? 1 : 0);
    },
    [labelOpacity]
  );

  const onFrameLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      frameSize.current = { width, height };
      if (lastScale.current > 1.01) {
        const { x, y } = clampOffset(lastOffset.current.x, lastOffset.current.y, lastScale.current);
        if (x !== lastOffset.current.x || y !== lastOffset.current.y) {
          settleOffset(x, y);
        }
      }
    },
    [clampOffset, settleOffset]
  );

  const onPinchEvent = useRef(
    Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true })
  ).current;

  const onPinchStateChange = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => {
      if (nativeEvent.oldState === State.ACTIVE) {
        const next = clamp(lastScale.current * nativeEvent.scale, MIN_SCALE, MAX_SCALE);
        lastScale.current = next;
        baseScale.setValue(next);
        pinchScale.setValue(1);
        const { x, y } = clampOffset(lastOffset.current.x, lastOffset.current.y, next);
        settleOffset(x, y);
        applyLabelOpacity(next);
        setCurrentScale(next);
        if (next > 1.05 && !hintDismissed) setHintDismissed(true);
      }
    },
    [baseScale, pinchScale, clampOffset, settleOffset, applyLabelOpacity, hintDismissed]
  );

  const onPanEvent = useRef(
    Animated.event([{ nativeEvent: { translationX: translateX, translationY: translateY } }], {
      useNativeDriver: true,
    })
  ).current;

  const onPanStateChange = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (nativeEvent.oldState === State.ACTIVE) {
        const { x, y } = clampOffset(
          lastOffset.current.x + nativeEvent.translationX,
          lastOffset.current.y + nativeEvent.translationY,
          lastScale.current
        );
        settleOffset(x, y);
      }
    },
    [clampOffset, settleOffset]
  );

  const animateTo = useCallback(
    (target: number) => {
      const next = clamp(target, MIN_SCALE, MAX_SCALE);
      const { x, y } = clampOffset(lastOffset.current.x, lastOffset.current.y, next);
      pinchScale.setValue(1);
      // Collapse offset into value so the spring animates to the true target.
      translateX.setOffset(0);
      translateX.setValue(lastOffset.current.x);
      translateY.setOffset(0);
      translateY.setValue(lastOffset.current.y);
      Animated.parallel([
        Animated.spring(baseScale, { toValue: next, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateX, { toValue: x, useNativeDriver: true, friction: 7 }),
        Animated.spring(translateY, { toValue: y, useNativeDriver: true, friction: 7 }),
        Animated.timing(labelOpacity, {
          toValue: next >= LABEL_VISIBLE_SCALE ? 1 : 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => settleOffset(x, y));
      lastScale.current = next;
      lastOffset.current = { x, y };
      setCurrentScale(next);
      if (next > 1.05 && !hintDismissed) setHintDismissed(true);
    },
    [baseScale, pinchScale, translateX, translateY, labelOpacity, clampOffset, settleOffset, hintDismissed]
  );

  const resetView = useCallback(() => animateTo(MIN_SCALE), [animateTo]);
  const handleZoomIn = useCallback(() => animateTo(lastScale.current + 0.5), [animateTo]);
  const handleZoomOut = useCallback(() => animateTo(lastScale.current - 0.5), [animateTo]);

  const pathLabel = `${walkingPathCm} cm path`;
  const edgeLabel = `${edgeBufferCm} cm edge`;
  const compassDim = `${widthM.toFixed(1)} m wide`;
  const legendFooter =
    edgeBufferCm > 0 ? `${walkingPathCm} cm path · ${edgeBufferCm} cm edge` : `${walkingPathCm} cm path each side`;
  const isInlinePreview = onExpand !== undefined;
  const showZoomControls = !isInlinePreview;
  const showHint = !isInlinePreview && !hintDismissed;
  const atMinZoom = currentScale <= MIN_SCALE + 0.001;
  const atMaxZoom = currentScale >= MAX_SCALE - 0.001;

  return (
    <View style={styles.tdmMapWrap}>
      <View style={styles.tdmRuler}>
        {rulerTicks.map((m) => (
          <Text
            key={m}
            style={[styles.tdmRulerTick, { top: `${(m / lengthM) * 100}%` }]}
          >
            {m.toFixed(1)} m
          </Text>
        ))}
      </View>

      <View style={styles.tdmFrame}>
        <View style={styles.tdmCompass}>
          <Text style={styles.tdmCompassN}>↑ N · canopy</Text>
          <Text style={styles.tdmCompassDim}>{compassDim}</Text>
        </View>

        <CanvasGestureWrap
          isInlinePreview={isInlinePreview}
          onExpand={onExpand}
          onPinchEvent={onPinchEvent}
          onPinchStateChange={onPinchStateChange}
          onPanEvent={onPanEvent}
          onPanStateChange={onPanStateChange}
          panEnabled={currentScale > 1.01}
        >
          <View
            style={[
              styles.tdmCanvasFrame,
              { aspectRatio: clampedAspect, minHeight: responsiveMinHeight },
            ]}
            onLayout={onFrameLayout}
          >
            <Animated.View
              style={[
                styles.tdmCanvas,
                { transform: [{ translateX }, { translateY }, { scale: composedScale }] },
              ]}
            >
              {pathPct > 0 && (
                <>
                  <View
                    style={[
                      styles.tdmPathStrip,
                      styles.tdmPathStripTop,
                      { height: `${pathPct}%` },
                    ]}
                  >
                    <Text style={[styles.tdmStripLabel, styles.tdmStripLabelN]}>
                      {pathLabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tdmPathStrip,
                      styles.tdmPathStripBottom,
                      { height: `${pathPct}%` },
                    ]}
                  >
                    <Text style={[styles.tdmStripLabel, styles.tdmStripLabelS]}>
                      {pathLabel}
                    </Text>
                  </View>
                </>
              )}

              {edgePctH > 0 && (
                <>
                  <View
                    style={[
                      styles.tdmEdgeStrip,
                      styles.tdmEdgeStripTop,
                      { height: `${edgePctH}%` },
                    ]}
                  >
                    <Text style={[styles.tdmStripLabel, styles.tdmStripLabelN]}>
                      {edgeLabel}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.tdmEdgeStrip,
                      styles.tdmEdgeStripBottom,
                      { height: `${edgePctH}%` },
                    ]}
                  >
                    <Text style={[styles.tdmStripLabel, styles.tdmStripLabelS]}>
                      {edgeLabel}
                    </Text>
                  </View>
                </>
              )}

              {Array.from({ length: gridRowCount }).map((_, i) => (
                <View
                  key={`gh-${i}`}
                  style={[
                    styles.tdmGridLineH,
                    { top: `${(((i + 1) * 30) / lengthCm) * 100}%` },
                  ]}
                />
              ))}
              {Array.from({ length: gridColCount }).map((_, i) => (
                <View
                  key={`gv-${i}`}
                  style={[
                    styles.tdmGridLineV,
                    { left: `${(((i + 1) * 30) / widthCm) * 100}%` },
                  ]}
                />
              ))}

              {rows.map((row) => {
                const centerPct = (row.northEdgeCm / lengthCm) * 100;
                const warning = warningByRow.get(row.rowIndex);
                return (
                  <React.Fragment key={`row-${row.rowIndex}`}>
                    <View
                      style={[styles.tdmRowCenterline, { top: `${centerPct}%` }]}
                      accessibilityLabel={`Row ${row.rowIndex} centerline at ${(row.northEdgeCm / 100).toFixed(2)} meters`}
                    />
                    <View style={[styles.tdmRowTag, { top: `${centerPct}%` }]}>
                      <Text style={styles.tdmRowTagText}>R{row.rowIndex}</Text>
                      {warning ? <Text style={styles.tdmRowTagWarn}> ⚠</Text> : null}
                    </View>
                  </React.Fragment>
                );
              })}

              {rows.map((row) => {
                const positions = computeInterleavedEastPositions(row);
                const topPct = (row.northEdgeCm / lengthCm) * 100;
                const carets: React.ReactNode[] = [];
                for (let i = 0; i < positions.length - 1; i++) {
                  const left = positions[i];
                  const right = positions[i + 1];
                  if (left === undefined || right === undefined) continue;
                  const gapCm = Math.round(right - left);
                  if (gapCm <= 0) continue;
                  const midPct = (((left + right) / 2) / widthCm) * 100;
                  carets.push(
                    <Animated.View
                      key={`gap-${row.rowIndex}-${i}`}
                      style={[
                        styles.tdmGapCaret,
                        {
                          left: `${midPct}%`,
                          top: `${topPct}%`,
                          opacity: labelOpacity,
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={[styles.tdmGapCaretText, { fontSize: gapCaretSize }]}>
                        ↔{gapCm}
                      </Text>
                    </Animated.View>
                  );
                }
                return <React.Fragment key={`gaps-${row.rowIndex}`}>{carets}</React.Fragment>;
              })}

              {rows.map((row) => {
                const positions = computeInterleavedEastPositions(row);
                return row.plants.map((plant, i) => {
                  const eastCm = positions[i];
                  if (eastCm === undefined) return null;
                  const leftPct = (eastCm / widthCm) * 100;
                  const topPct = (row.northEdgeCm / lengthCm) * 100;
                  const isCompanion = plant.isCompanion === true;
                  const isGround = row.layer === 'ground_cover';
                  return (
                    <View
                      key={`pinwrap-${row.rowIndex}-${i}`}
                      style={[
                        styles.tdmPinWrap,
                        {
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: pinWrapWidth,
                          marginLeft: -pinWrapWidth / 2,
                          marginTop: -pinSize / 2,
                        },
                      ]}
                      accessibilityLabel={`${plant.name} · ${plant.spacingCm} cm spacing${isCompanion ? ' · companion' : ''}`}
                    >
                      <View
                        style={[
                          styles.tdmPin,
                          { width: pinSize, height: pinSize, borderRadius: pinSize / 2 },
                          isGround && styles.tdmPinGround,
                          isCompanion
                            ? styles.tdmPinCompanion
                            : { borderColor: layerColor(row.layer) },
                        ]}
                      >
                        <Text style={[styles.tdmPinEmoji, { fontSize: pinEmojiSize }]}>
                          {plantEmoji(plant.name)}
                        </Text>
                      </View>
                      <Animated.Text
                        style={[
                          styles.tdmPinLabel,
                          { fontSize: pinLabelSize, opacity: labelOpacity },
                        ]}
                        numberOfLines={1}
                      >
                        {shortLabel(plant.name)}
                      </Animated.Text>
                    </View>
                  );
                });
              })}

              {overflowCm > 0 && (
                <View style={styles.tdmOverflowBadge}>
                  <Text style={styles.tdmOverflowText}>
                    ⚠ Overflow {Math.round(overflowCm)} cm
                  </Text>
                </View>
              )}

              <View style={styles.tdmScaleBar}>
                <Text style={styles.tdmScaleBarText}>
                  {widthM.toFixed(1)} × {lengthM.toFixed(1)} m
                </Text>
              </View>
            </Animated.View>

            {showHint && (
              <View style={styles.tdmZoomHint} pointerEvents="none">
                <Ionicons name="scan-outline" size={12} color={theme.textSecondary} />
                <Text style={styles.tdmZoomHintText}>Pinch or +/− to zoom</Text>
              </View>
            )}

            {showZoomControls && (
              <View style={styles.tdmZoomControls}>
                <TouchableOpacity
                  style={[styles.tdmZoomBtn, atMaxZoom && styles.tdmZoomBtnDisabled]}
                  onPress={handleZoomIn}
                  disabled={atMaxZoom}
                  accessibilityLabel="Zoom in"
                  hitSlop={6}
                >
                  <Ionicons name="add" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tdmZoomBtn, atMinZoom && styles.tdmZoomBtnDisabled]}
                  onPress={handleZoomOut}
                  disabled={atMinZoom}
                  accessibilityLabel="Zoom out"
                  hitSlop={6}
                >
                  <Ionicons name="remove" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tdmZoomBtn, atMinZoom && styles.tdmZoomBtnDisabled]}
                  onPress={resetView}
                  disabled={atMinZoom}
                  accessibilityLabel="Reset zoom"
                  hitSlop={6}
                >
                  <Ionicons name="contract-outline" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {isInlinePreview && (
              <View style={styles.tdmExpandButton} pointerEvents="none">
                <Ionicons name="expand-outline" size={16} color={theme.textSecondary} />
                <Text style={styles.tdmExpandButtonText}>Tap to zoom</Text>
              </View>
            )}
          </View>
        </CanvasGestureWrap>

        <View style={styles.tdmLegend}>
          <View style={styles.tdmLegendItem}>
            <View style={[styles.tdmLegendSwatch, styles.tdmLegendSwatchMain]} />
            <Text style={styles.tdmLegendText}>Main × {mainCount}</Text>
          </View>
          <View style={styles.tdmLegendItem}>
            <View style={[styles.tdmLegendSwatch, styles.tdmLegendSwatchCompanion]} />
            <Text style={styles.tdmLegendText}>Companion × {companionCount}</Text>
          </View>
          <Text style={styles.tdmLegendHint}>Tallest crops at North</Text>
        </View>

        <View style={styles.tdmCompass}>
          <Text style={styles.tdmCompassS}>↓ S · open sun</Text>
          <Text style={styles.tdmCompassDim}>{legendFooter}</Text>
        </View>
      </View>
    </View>
  );
}

export function BedTopDownMap(props: BedTopDownMapProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (props.rows.length === 0) return null;

  const inlineMapWidth = Math.max(220, windowWidth - HORIZONTAL_OVERHEAD);
  const modalMapWidth = Math.max(280, windowWidth - MODAL_HORIZONTAL_OVERHEAD);
  const modalHeightCap = Math.max(280, windowHeight - MODAL_VERTICAL_CHROME);

  const dimensionLabel = `${props.widthM.toFixed(1)} × ${props.lengthM.toFixed(1)} m`;

  return (
    <>
      <View style={styles.tdmCard}>
        <View style={styles.tdmHeader}>
          <Text style={styles.tdmEyebrow}>TOP-DOWN VIEW</Text>
          <Text style={styles.tdmMeta}>scale · 30 cm grid</Text>
        </View>
        <BedTopDownCanvas
          {...props}
          mapWidth={inlineMapWidth}
          frameHeightCap={360}
          onExpand={() => setIsFullScreen(true)}
        />
      </View>

      <Modal
        visible={isFullScreen}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <GestureHandlerRootView style={styles.tdmModalGestureRoot}>
          <View style={styles.tdmModalRoot}>
            <View style={styles.tdmModalHeader}>
              <Text style={styles.tdmModalTitle}>{dimensionLabel}</Text>
              <TouchableOpacity
                style={styles.tdmModalClose}
                onPress={() => setIsFullScreen(false)}
                accessibilityLabel="Close fullscreen map"
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.tdmModalCanvasWrap}>
              <BedTopDownCanvas
                {...props}
                mapWidth={modalMapWidth}
                frameHeightCap={modalHeightCap}
              />
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

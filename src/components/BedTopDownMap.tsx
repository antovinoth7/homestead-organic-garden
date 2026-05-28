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
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
  composedGesture: ReturnType<typeof Gesture.Simultaneous>;
  onExpand?: () => void;
  children: React.ReactNode;
}

function CanvasGestureWrap({
  isInlinePreview,
  composedGesture,
  onExpand,
  children,
}: CanvasGestureWrapProps): React.JSX.Element {
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
  return <GestureDetector gesture={composedGesture}>{children as React.ReactElement}</GestureDetector>;
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

  // ── Pinch + pan state ────────────────────────────────────────────────────
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const savedScale = useRef(1);
  const savedTx = useRef(0);
  const savedTy = useRef(0);
  const frameSize = useRef({ width: 0, height: 0 });
  const [currentScale, setCurrentScale] = useState(1);
  const [hintDismissed, setHintDismissed] = useState(false);

  const onFrameLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      frameSize.current = { width, height };
      if (savedScale.current > 1.01) {
        const maxTx = (width * (savedScale.current - 1)) / 2;
        const maxTy = (height * (savedScale.current - 1)) / 2;
        const tx = clamp(savedTx.current, -maxTx, maxTx);
        const ty = clamp(savedTy.current, -maxTy, maxTy);
        if (tx !== savedTx.current || ty !== savedTy.current) {
          savedTx.current = tx;
          savedTy.current = ty;
          translateX.setValue(tx);
          translateY.setValue(ty);
        }
      }
    },
    [translateX, translateY]
  );

  const applyLabelOpacity = useCallback(
    (s: number) => {
      labelOpacity.setValue(s >= LABEL_VISIBLE_SCALE ? 1 : 0);
    },
    [labelOpacity]
  );

  const commitState = useCallback(
    (s: number, tx: number, ty: number) => {
      savedScale.current = s;
      savedTx.current = tx;
      savedTy.current = ty;
      setCurrentScale(s);
      if (s > 1.05 && !hintDismissed) setHintDismissed(true);
    },
    [hintDismissed]
  );

  const resetView = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 7 }),
      Animated.timing(labelOpacity, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start();
    savedScale.current = 1;
    savedTx.current = 0;
    savedTy.current = 0;
    setCurrentScale(1);
  }, [scale, translateX, translateY, labelOpacity]);

  const composedGesture = useMemo(() => {
    const pinchBase = { scale: 1 };
    const pinch = Gesture.Pinch()
      .onStart(() => {
        pinchBase.scale = savedScale.current;
      })
      .onUpdate((e) => {
        const next = clamp(pinchBase.scale * e.scale, MIN_SCALE, MAX_SCALE);
        scale.setValue(next);
        applyLabelOpacity(next);
      })
      .onEnd((e) => {
        const next = clamp(pinchBase.scale * e.scale, MIN_SCALE, MAX_SCALE);
        commitState(next, savedTx.current, savedTy.current);
      });

    const panBase = { tx: 0, ty: 0 };
    const pan = Gesture.Pan()
      .minPointers(1)
      .maxPointers(1)
      .activeOffsetX([-8, 8])
      .activeOffsetY([-8, 8])
      .onStart(() => {
        panBase.tx = savedTx.current;
        panBase.ty = savedTy.current;
      })
      .onUpdate((e) => {
        const maxTx = (frameSize.current.width * (savedScale.current - 1)) / 2;
        const maxTy = (frameSize.current.height * (savedScale.current - 1)) / 2;
        translateX.setValue(clamp(panBase.tx + e.translationX, -maxTx, maxTx));
        translateY.setValue(clamp(panBase.ty + e.translationY, -maxTy, maxTy));
      })
      .onEnd((e) => {
        const maxTx = (frameSize.current.width * (savedScale.current - 1)) / 2;
        const maxTy = (frameSize.current.height * (savedScale.current - 1)) / 2;
        commitState(
          savedScale.current,
          clamp(panBase.tx + e.translationX, -maxTx, maxTx),
          clamp(panBase.ty + e.translationY, -maxTy, maxTy)
        );
      });

    return Gesture.Simultaneous(pinch, pan);
  }, [scale, translateX, translateY, applyLabelOpacity, commitState]);

  const pathLabel = `${walkingPathCm} cm path`;
  const edgeLabel = `${edgeBufferCm} cm edge`;
  const compassDim = `${widthM.toFixed(1)} m wide`;
  const legendFooter =
    edgeBufferCm > 0 ? `${walkingPathCm} cm path · ${edgeBufferCm} cm edge` : `${walkingPathCm} cm path each side`;
  const isInlinePreview = onExpand !== undefined;
  const showResetButton = !isInlinePreview && currentScale > 1.01;
  const showHint = !isInlinePreview && !hintDismissed;

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
          composedGesture={composedGesture}
          onExpand={onExpand}
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
                { transform: [{ translateX }, { translateY }, { scale }] },
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
                <Text style={styles.tdmZoomHintText}>Pinch to zoom</Text>
              </View>
            )}

            {showResetButton && (
              <TouchableOpacity
                style={styles.tdmZoomReset}
                onPress={resetView}
                accessibilityLabel="Reset zoom"
                hitSlop={6}
              >
                <Ionicons name="contract-outline" size={16} color={theme.textSecondary} />
              </TouchableOpacity>
            )}

            {isInlinePreview && (
              <View style={styles.tdmExpandButton} pointerEvents="none">
                <Ionicons name="expand-outline" size={16} color={theme.textSecondary} />
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
      </Modal>
    </>
  );
}

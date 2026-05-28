import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';
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
const LABEL_VISIBLE_SCALE = 1.4;

function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function BedTopDownMap({
  widthM,
  lengthM,
  rows,
  plantEmoji,
  layerColor,
  walkingPathCm = 60,
  edgeBufferCm = 0,
  overflowCm = 0,
  rowWarnings = [],
}: BedTopDownMapProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const widthCm = Math.max(1, Math.round(widthM * 100));
  const lengthCm = Math.max(1, Math.round(lengthM * 100));

  // Y-axis ruler ticks every 0.5 m, anchored 0 → top, lengthM → bottom.
  const rulerTicks = useMemo<number[]>(() => {
    const ticks: number[] = [];
    for (let m = 0; m <= lengthM + 1e-6; m += 0.5) {
      ticks.push(Math.round(m * 10) / 10);
    }
    return ticks;
  }, [lengthM]);

  // 30 cm grid: evenly spaced lines, count derived from bed dimensions.
  const gridColCount = Math.max(0, Math.round(widthCm / 30) - 1);
  const gridRowCount = Math.max(0, Math.round(lengthCm / 30) - 1);

  // Walking path strips clamp to half the bed so they never collapse the canvas.
  const pathPct = Math.min(50, (walkingPathCm / lengthCm) * 100);
  // Edge buffer strips on E/W, clamped to a quarter of bed width.
  const edgePctW = edgeBufferCm > 0 ? Math.min(25, (edgeBufferCm / widthCm) * 100) : 0;

  // Clamp extreme bed shapes so the canvas stays readable on phones.
  const rawAspect = widthM / lengthM;
  const clampedAspect = clamp(rawAspect, 0.4, 3);

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

  const onFrameLayout = useCallback((e: LayoutChangeEvent) => {
    frameSize.current = {
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    };
  }, []);

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
    // Snapshot base values at gesture start so e.scale / e.translationX are
    // applied as deltas, not multiplied against already-updated saved state.
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
      .activeOffsetX([-10, 10])
      .activeOffsetY([-10, 10])
      .onStart(() => {
        panBase.tx = savedTx.current;
        panBase.ty = savedTy.current;
      })
      .onUpdate((e) => {
        if (savedScale.current <= 1.01) return;
        const maxTx = (frameSize.current.width * (savedScale.current - 1)) / 2;
        const maxTy = (frameSize.current.height * (savedScale.current - 1)) / 2;
        translateX.setValue(clamp(panBase.tx + e.translationX, -maxTx, maxTx));
        translateY.setValue(clamp(panBase.ty + e.translationY, -maxTy, maxTy));
      })
      .onEnd((e) => {
        if (savedScale.current <= 1.01) return;
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

  if (rows.length === 0) return null;

  const pathLabel = `${walkingPathCm} cm path`;
  const edgeLabel = `${edgeBufferCm} cm edge`;
  const compassDim = `${widthM.toFixed(1)} m wide`;
  const legendFooter =
    edgeBufferCm > 0 ? `${walkingPathCm} cm path · ${edgeBufferCm} cm edge` : `${walkingPathCm} cm path each side`;
  const showResetButton = currentScale > 1.01;
  const showHint = !hintDismissed;

  return (
    <View style={styles.tdmCard}>
      <View style={styles.tdmHeader}>
        <Text style={styles.tdmEyebrow}>TOP-DOWN VIEW</Text>
        <Text style={styles.tdmMeta}>scale · 30 cm grid</Text>
      </View>

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

          <GestureDetector gesture={composedGesture}>
            <View
              style={[styles.tdmCanvasFrame, { aspectRatio: clampedAspect }]}
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

                {edgePctW > 0 && (
                  <>
                    <View
                      style={[
                        styles.tdmEdgeStrip,
                        styles.tdmEdgeStripLeft,
                        { width: `${edgePctW}%` },
                      ]}
                    >
                      <Text style={[styles.tdmStripLabel, styles.tdmStripLabelW]}>
                        {edgeLabel}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.tdmEdgeStrip,
                        styles.tdmEdgeStripRight,
                        { width: `${edgePctW}%` },
                      ]}
                    >
                      <Text style={[styles.tdmStripLabel, styles.tdmStripLabelE]}>
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
                      { top: `${((i + 1) / (gridRowCount + 1)) * 100}%` },
                    ]}
                  />
                ))}
                {Array.from({ length: gridColCount }).map((_, i) => (
                  <View
                    key={`gv-${i}`}
                    style={[
                      styles.tdmGridLineV,
                      { left: `${((i + 1) / (gridColCount + 1)) * 100}%` },
                    ]}
                  />
                ))}

                {rows.map((row) => {
                  const centerPct = (row.northEdgeCm / lengthCm) * 100;
                  const warning = warningByRow.get(row.rowIndex);
                  const anchorGap = row.plants[0]?.spacingCm;
                  return (
                    <React.Fragment key={`row-${row.rowIndex}`}>
                      <View
                        style={[styles.tdmRowCenterline, { top: `${centerPct}%` }]}
                        accessibilityLabel={`Row ${row.rowIndex} centerline at ${(row.northEdgeCm / 100).toFixed(2)} meters`}
                      />
                      <View style={[styles.tdmRowTag, { top: `${centerPct}%` }]}>
                        <Text style={styles.tdmRowTagText}>R{row.rowIndex}</Text>
                        {anchorGap !== undefined && (
                          <Text style={styles.tdmRowTagGap}>↔{anchorGap}cm</Text>
                        )}
                        {warning ? <Text style={styles.tdmRowTagWarn}> ⚠</Text> : null}
                      </View>
                    </React.Fragment>
                  );
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
                        style={[styles.tdmPinWrap, { left: `${leftPct}%`, top: `${topPct}%` }]}
                        accessibilityLabel={`${plant.name} · ${plant.spacingCm} cm spacing${isCompanion ? ' · companion' : ''}`}
                      >
                        <View
                          style={[
                            styles.tdmPin,
                            isGround && styles.tdmPinGround,
                            isCompanion
                              ? styles.tdmPinCompanion
                              : { borderColor: layerColor(row.layer) },
                          ]}
                        >
                          <Text style={styles.tdmPinEmoji}>{plantEmoji(plant.name)}</Text>
                        </View>
                        <Animated.Text
                          style={[styles.tdmPinLabel, { opacity: labelOpacity }]}
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
            </View>
          </GestureDetector>

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
    </View>
  );
}

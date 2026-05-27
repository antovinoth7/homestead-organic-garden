import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
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
  overflowCm?: number;
  rowWarnings?: RowWarning[];
}

// Truncate species name to fit under the pin without wrapping.
function shortLabel(name: string): string {
  return name.length > 7 ? `${name.slice(0, 6)}…` : name;
}

export function BedTopDownMap({
  widthM,
  lengthM,
  rows,
  plantEmoji,
  layerColor,
  walkingPathCm = 60,
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

  if (rows.length === 0) return null;

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
            <Text style={styles.tdmCompassDim}>{widthM.toFixed(1)} m wide</Text>
          </View>

          <View style={[styles.tdmCanvas, { aspectRatio: widthM / lengthM }]}>
            {pathPct > 0 && (
              <>
                <View
                  style={[styles.tdmPathStrip, styles.tdmPathStripTop, { height: `${pathPct}%` }]}
                />
                <View
                  style={[
                    styles.tdmPathStrip,
                    styles.tdmPathStripBottom,
                    { height: `${pathPct}%` },
                  ]}
                />
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
                    <Text style={styles.tdmPinLabel} numberOfLines={1}>
                      {shortLabel(plant.name)}
                    </Text>
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
          </View>

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
            <Text style={styles.tdmCompassDim}>60 cm path each side</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

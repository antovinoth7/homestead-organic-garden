import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedCreationWizardStyles';
import type { BedRow } from '@/utils/rowLayoutEngine';
import type { BedLayer } from '@/types/database.types';

interface BedTopDownMapProps {
  widthM: number;
  lengthM: number;
  rows: BedRow[];
  plantEmoji: (name: string) => string;
  layerColor: (layer: BedLayer) => string;
}

// Mirrors the engine's interleavePlants distribution: mains occupy their
// eastPositionsCm slots; interplanted companions are placed in interior gaps
// (or extended past a lone main / used as anchors when no mains exist).
function computePlantEastPositions(row: BedRow): number[] {
  const mains = row.plants.filter((p) => p.isCompanion !== true);
  const companions = row.plants.filter((p) => p.isCompanion === true);
  const positions: number[] = [];

  mains.forEach((_, i) => {
    positions.push(row.eastPositionsCm[i] ?? 0);
  });

  if (companions.length === 0) return positions;

  if (mains.length === 0) {
    companions.forEach((_, i) => {
      positions.push(row.eastPositionsCm[i] ?? 0);
    });
    return positions;
  }

  if (mains.length === 1) {
    const main = row.eastPositionsCm[0] ?? 0;
    const spacing = mains[0]?.spacingCm ?? 30;
    for (let j = 0; j < companions.length; j++) {
      positions.push(main + ((j + 1) * spacing) / (companions.length + 1));
    }
    return positions;
  }

  const gapCount = mains.length - 1;
  const perGapBase = Math.floor(companions.length / gapCount);
  const remainder = companions.length - perGapBase * gapCount;

  let cIdx = 0;
  for (let i = 0; i < gapCount; i++) {
    const take = perGapBase + (i < remainder ? 1 : 0);
    const left = row.eastPositionsCm[i] ?? 0;
    const right = row.eastPositionsCm[i + 1] ?? 0;
    for (let k = 0; k < take && cIdx < companions.length; k++) {
      const t = (k + 1) / (take + 1);
      positions.push(left + t * (right - left));
      cIdx++;
    }
  }
  while (cIdx < companions.length) {
    positions.push(row.eastPositionsCm[mains.length - 1] ?? 0);
    cIdx++;
  }

  return positions;
}

export function BedTopDownMap({
  widthM,
  lengthM,
  rows,
  plantEmoji,
  layerColor,
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
              const bandTop = Math.max(
                0,
                ((row.northEdgeCm - row.rowSpacingCm / 2) / lengthCm) * 100
              );
              const bandHeight = (row.rowSpacingCm / lengthCm) * 100;
              return (
                <View
                  key={`band-${row.rowIndex}`}
                  style={[
                    styles.tdmRowBand,
                    { top: `${bandTop}%`, height: `${bandHeight}%` },
                  ]}
                >
                  <View style={styles.tdmRowTag}>
                    <Text style={styles.tdmRowTagText}>R{row.rowIndex}</Text>
                  </View>
                </View>
              );
            })}

            {rows.map((row) => {
              const positions = computePlantEastPositions(row);
              return row.plants.map((plant, i) => {
                const eastCm = positions[i];
                if (eastCm === undefined) return null;
                const leftPct = (eastCm / widthCm) * 100;
                const topPct = (row.northEdgeCm / lengthCm) * 100;
                const isCompanion = plant.isCompanion === true;
                const isGround = row.layer === 'ground_cover';
                return (
                  <View
                    key={`pin-${row.rowIndex}-${i}`}
                    style={[
                      styles.tdmPin,
                      { left: `${leftPct}%`, top: `${topPct}%` },
                      isGround && styles.tdmPinGround,
                      isCompanion
                        ? styles.tdmPinCompanion
                        : { borderColor: layerColor(row.layer) },
                    ]}
                  >
                    <Text style={styles.tdmPinEmoji}>{plantEmoji(plant.name)}</Text>
                  </View>
                );
              });
            })}

            <View style={styles.tdmScaleBar}>
              <Text style={styles.tdmScaleBarText}>
                {widthM.toFixed(1)} × {lengthM.toFixed(1)} m
              </Text>
            </View>
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

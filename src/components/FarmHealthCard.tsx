/**
 * FarmHealthCard (Phase C, C.7).
 *
 * Farm header (families + usable area + bed count) · plant-health tiles
 * (Healthy/Stressed/Sick from getPlantHealthSummary) · mini capacity bars for
 * legume / leafy / fruiting bed share (from useFarmCapacity.calcCategoryPct).
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PlantHealthSummary } from '@/utils/plantHealth';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/farmHealthCardStyles';

export type HealthFilter = 'healthy' | 'stressed' | 'sick';

interface CapacityBar {
  label: string;
  pct: number;
  color: string;
}

interface Props {
  health: PlantHealthSummary;
  /** Category % breakdown from useFarmCapacity.metrics.categoryBreakdown. */
  categoryBreakdown?: Record<string, number> | null;
  bedCount: number;
  usableSqm?: number | null;
  familiesCount?: number | null;
  onPressHealth: (filter: HealthFilter) => void;
}

export const FarmHealthCard = React.memo(function FarmHealthCard({
  health,
  categoryBreakdown,
  bedCount,
  usableSqm,
  familiesCount,
  onPressHealth,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const onHealthy = useCallback(() => onPressHealth('healthy'), [onPressHealth]);
  const onStressed = useCallback(() => onPressHealth('stressed'), [onPressHealth]);
  const onSick = useCallback(() => onPressHealth('sick'), [onPressHealth]);

  const capacityBars: CapacityBar[] = useMemo(() => {
    if (!categoryBreakdown) return [];
    return [
      { label: 'Legume', pct: categoryBreakdown.root_legume ?? 0, color: theme.warning },
      { label: 'Leafy', pct: categoryBreakdown.leafy ?? 0, color: theme.success },
      { label: 'Fruiting', pct: categoryBreakdown.fruiting ?? 0, color: theme.accent },
    ];
  }, [categoryBreakdown, theme]);

  const subtitleParts: string[] = [];
  if (bedCount > 0) subtitleParts.push(`${bedCount} bed${bedCount === 1 ? '' : 's'}`);
  if (usableSqm && usableSqm > 0) subtitleParts.push(`${Math.round(usableSqm)} m² usable`);
  if (familiesCount && familiesCount > 0) {
    subtitleParts.push(`${familiesCount} famil${familiesCount === 1 ? 'y' : 'ies'}`);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>🌱 Garden Health</Text>
          {subtitleParts.length > 0 && (
            <Text style={styles.subtitle}>{subtitleParts.join(' · ')}</Text>
          )}
        </View>
      </View>

      <View style={styles.healthRow}>
        <TouchableOpacity style={styles.healthColumn} onPress={onHealthy}>
          <View style={[styles.healthDot, { backgroundColor: theme.success }]} />
          <Text style={styles.healthCount}>{health.healthy}</Text>
          <Text style={styles.healthLabel}>Healthy</Text>
        </TouchableOpacity>
        <View style={styles.healthDivider} />
        <TouchableOpacity style={styles.healthColumn} onPress={onStressed}>
          <View style={[styles.healthDot, { backgroundColor: theme.warning }]} />
          <Text style={styles.healthCount}>{health.stressed}</Text>
          <Text style={styles.healthLabel}>Stressed</Text>
        </TouchableOpacity>
        <View style={styles.healthDivider} />
        <TouchableOpacity style={styles.healthColumn} onPress={onSick}>
          <View style={[styles.healthDot, { backgroundColor: theme.error }]} />
          <Text style={styles.healthCount}>{health.sick}</Text>
          <Text style={styles.healthLabel}>Sick</Text>
        </TouchableOpacity>
      </View>

      {capacityBars.length > 0 && (
        <View style={styles.capacitySection}>
          {capacityBars.map((bar) => (
            <View key={bar.label} style={styles.capacityRow}>
              <Text style={styles.capacityLabel}>{bar.label}</Text>
              <View style={styles.capacityTrack}>
                <View
                  style={[
                    styles.capacityFill,
                    { width: `${Math.min(100, Math.max(0, bar.pct))}%`, backgroundColor: bar.color },
                  ]}
                />
              </View>
              <Text style={styles.capacityPct}>{Math.round(bar.pct)}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

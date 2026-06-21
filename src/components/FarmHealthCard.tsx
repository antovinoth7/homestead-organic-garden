/**
 * FarmHealthCard (Phase C, C.7).
 *
 * Farm header (usable area + bed count) · plant-health tiles
 * (Healthy/Stressed/Sick from getPlantHealthSummary).
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PlantHealthSummary } from '@/utils/plantHealth';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/farmHealthCardStyles';

export type HealthFilter = 'healthy' | 'stressed' | 'sick';

interface Props {
  health: PlantHealthSummary;
  bedCount: number;
  usableSqm?: number | null;
  onPressHealth: (filter: HealthFilter) => void;
}

export const FarmHealthCard = React.memo(function FarmHealthCard({
  health,
  bedCount,
  usableSqm,
  onPressHealth,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const onHealthy = useCallback(() => onPressHealth('healthy'), [onPressHealth]);
  const onStressed = useCallback(() => onPressHealth('stressed'), [onPressHealth]);
  const onSick = useCallback(() => onPressHealth('sick'), [onPressHealth]);

  const subtitleParts: string[] = [];
  if (bedCount > 0) subtitleParts.push(`${bedCount} bed${bedCount === 1 ? '' : 's'}`);
  if (usableSqm && usableSqm > 0) subtitleParts.push(`${Math.round(usableSqm)} m² usable`);

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
    </View>
  );
});

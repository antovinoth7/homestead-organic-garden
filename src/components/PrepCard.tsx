import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import type { BedSlope, SoilType, PestHistoryItem } from '@/types/database.types';

interface Props {
  soilType: SoilType;
  slope: BedSlope;
  isRaised: boolean;
  pestHistory: PestHistoryItem[];
  transitionSteps: string[];
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    title: { fontSize: 14, fontWeight: '700', color: theme.text, marginBottom: 10 },
    stepRow: { flexDirection: 'row', gap: 8, marginBottom: 6, paddingRight: 8 },
    stepBullet: { fontSize: 13, color: theme.primary, lineHeight: 20 },
    stepText: { flex: 1, fontSize: 13, color: theme.text, lineHeight: 20 },
    adaptationBanner: {
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
      backgroundColor: theme.warningLight ?? '#fef3c7',
      borderRadius: 6,
      padding: 8,
      marginTop: 8,
    },
    adaptationText: { flex: 1, fontSize: 12, color: theme.warning ?? '#f59e0b' },
  });

/**
 * Displays soil preparation steps for a bed transition, adapted for
 * local conditions (laterite soil, slope, pest history).
 */
export function PrepCard({
  soilType,
  slope,
  pestHistory,
  transitionSteps,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const adaptations: string[] = [];
  if (soilType === 'red_laterite' || soilType === 'coastal_sandy') {
    adaptations.push(
      `${soilType.replace(/_/g, ' ')} soil — add extra organic matter (3 kg compost/sqm)`
    );
  }
  if (slope === 'moderate' || slope === 'steep') {
    adaptations.push('Sloped terrain — build contour bunds to prevent soil erosion');
  }
  if (pestHistory.some((p) => p.severity === 'high' || p.severity === 'severe')) {
    adaptations.push('High-severity pest history — apply neem cake + Trichoderma before planting');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Soil Preparation</Text>
      {transitionSteps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <Text style={styles.stepBullet}>{i + 1}.</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
      {adaptations.map((a, i) => (
        <View key={`adapt-${i}`} style={styles.adaptationBanner}>
          <Ionicons name="alert-circle-outline" size={14} color={theme.warning ?? '#f59e0b'} />
          <Text style={styles.adaptationText}>{a}</Text>
        </View>
      ))}
    </View>
  );
}

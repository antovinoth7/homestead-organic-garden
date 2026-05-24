import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';

interface Props {
  widthM: number;
  lengthM: number;
  isRaised: boolean;
}

const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    bedShape: {
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
    },
    bedLabel: { fontSize: 10, color: theme.textSecondary },
    compass: {
      position: 'absolute',
      top: 4,
      right: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    compassText: { fontSize: 10, fontWeight: '700', color: theme.primary },
    dimensionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    dimensionText: { fontSize: 12, color: theme.textSecondary },
    orientLabel: { fontSize: 11, color: theme.textSecondary, marginTop: 6 },
    raisedBadge: {
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: theme.primaryLight,
    },
    raisedText: { fontSize: 11, color: theme.primary, fontWeight: '600' },
  });

/**
 * Simple N→S bed zone illustration showing orientation and dimensions.
 * This is a placeholder for the full SVG diagram (B2.11 deferred).
 */
export function BedZoneIllustration({ widthM, lengthM, isRaised }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Scale bed to fit within a max display area of 200x140
  const maxW = 200;
  const maxH = 140;
  const scale = Math.min(maxW / (widthM * 40), maxH / (lengthM * 40));
  const displayW = Math.round(widthM * 40 * scale);
  const displayH = Math.round(lengthM * 40 * scale);

  return (
    <View style={styles.container}>
      <View style={[styles.bedShape, { width: displayW, height: displayH }]}>
        <View style={styles.compass}>
          <Ionicons name="navigate-outline" size={12} color={theme.primary} />
          <Text style={styles.compassText}>N</Text>
        </View>
        <Text style={styles.bedLabel}>
          {widthM}m × {lengthM}m
        </Text>
      </View>
      <View style={styles.dimensionRow}>
        <Text style={styles.dimensionText}>
          Width: {widthM}m • Length: {lengthM}m • Area: {(widthM * lengthM).toFixed(1)} sqm
        </Text>
      </View>
      <Text style={styles.orientLabel}>
        Orientation: North → South (tallest plants on north side)
      </Text>
      {isRaised && (
        <View style={styles.raisedBadge}>
          <Text style={styles.raisedText}>Raised bed (30 cm height)</Text>
        </View>
      )}
    </View>
  );
}

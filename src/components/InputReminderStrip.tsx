/**
 * InputReminderStrip (Phase C, C.13).
 *
 * Jeevamrutha batch reminder. Volume = land_cents × bed_count × 2L. Hidden when
 * the farm isn't configured (no land cents or no beds). Deep-links to the
 * Jeevamrutha recipe.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/inputReminderStripStyles';

/** Litres of Jeevamrutha per cent per bed, per batch. */
const LITRES_PER_CENT_PER_BED = 2;

interface Props {
  landCents: number;
  bedCount: number;
  /** Cadence label for the current season (e.g. "Every 14 days"). */
  cadenceLabel?: string;
  onPress: () => void;
}

export const InputReminderStrip = React.memo(function InputReminderStrip({
  landCents,
  bedCount,
  cadenceLabel,
  onPress,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onPress(), [onPress]);

  if (landCents <= 0 || bedCount <= 0) return null;

  const litres = Math.round(landCents * bedCount * LITRES_PER_CENT_PER_BED);

  return (
    <TouchableOpacity style={styles.strip} activeOpacity={0.8} onPress={handlePress}>
      <Text style={styles.icon}>🧪</Text>
      <View style={styles.body}>
        <Text style={styles.title}>
          Jeevamrutha · ~{litres}L for {bedCount} bed{bedCount === 1 ? '' : 's'}
        </Text>
        <Text style={styles.detail}>{cadenceLabel ?? 'Keep a batch ready'} · tap for recipe</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  );
});

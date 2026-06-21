/**
 * AlmanacHighlight (Phase C, C.4). Monthly highlight card + link to the full
 * SeasonalAlmanacScreen.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/almanacHighlightStyles';
import { getMonthlyHighlight } from '@/config/almanac';

interface Props {
  /** Invoked when the "View full almanac" link is tapped. */
  onViewAll: () => void;
}

export const AlmanacHighlight = React.memo(function AlmanacHighlight({
  onViewAll,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const month = useMemo(() => getMonthlyHighlight(), []);
  const handleViewAll = useCallback(() => onViewAll(), [onViewAll]);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.icon}>{month.icon}</Text>
        <View style={styles.body}>
          <Text style={styles.label}>📅 {month.label} Almanac</Text>
          <Text style={styles.highlight}>{month.highlight}</Text>
        </View>
      </View>
      <Text style={styles.note}>{month.note}</Text>
      <TouchableOpacity style={styles.link} onPress={handleViewAll} activeOpacity={0.7}>
        <Text style={styles.linkText}>View full almanac</Text>
        <Ionicons name="chevron-forward" size={14} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
});

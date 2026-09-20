/**
 * NeedsActionRow — one exception in the Today screen's needs-action list.
 *
 * A row, not a card: icon tile, what it is, where it is, why it is here, and a
 * chevron. There is no inline action — tapping opens the plant or bed, where the
 * full context needed to decide is already on screen.
 *
 * The `where` line is the point of the row. The plot cards above already state
 * how much work each plot owes; what they cannot say is which crop or bed the
 * exception is on, and a row without it cannot be tied back to any card.
 */

import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GardenIcon } from '@/components/GardenIcon';
import { NeedsActionItem } from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/needsActionListStyles';

interface Props {
  item: NeedsActionItem;
  onPress: (item: NeedsActionItem) => void;
}

export const NeedsActionRow = React.memo(function NeedsActionRow({
  item,
  onPress,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { alert, where } = item;

  const handlePress = useCallback(() => onPress(item), [onPress, item]);

  const tone =
    alert.severity === 'critical'
      ? styles.iconCritical
      : alert.severity === 'warning'
        ? styles.iconWarning
        : styles.iconInfo;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={
        where ? `${alert.title}, ${where}. ${alert.message}` : `${alert.title}. ${alert.message}`
      }
    >
      <View style={[styles.icon, tone]}>
        <GardenIcon name={alert.iconKey} size={20} color={theme.text} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {alert.title}
        </Text>
        {where !== '' && (
          <Text style={styles.where} numberOfLines={1}>
            {where}
          </Text>
        )}
        <Text style={styles.meta} numberOfLines={1}>
          {alert.message}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
    </TouchableOpacity>
  );
});

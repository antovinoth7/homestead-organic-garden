/**
 * NeedsAttentionScroll (Phase C, C.8).
 *
 * Horizontal scroll of the actionable farm alerts, ordered most-urgent first.
 * Fed by `alerts.ts` (`getFarmAlerts(...).filter(isActionable)`) — no inline
 * alert logic. By default every actionable alert is shown so the header count
 * matches what's reachable; pass `maxItems` to cap. Tapping a card bubbles the
 * alert up so the screen can navigate.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { FarmAlert } from '@/types/database.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/needsAttentionScrollStyles';

interface Props {
  alerts: FarmAlert[];
  onPressAlert: (alert: FarmAlert) => void;
  /** Optional cap on cards shown. Defaults to showing all actionable alerts. */
  maxItems?: number;
}

const keyExtractor = (item: FarmAlert): string => item.id;

export const NeedsAttentionScroll = React.memo(function NeedsAttentionScroll({
  alerts,
  onPressAlert,
  maxItems,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const visible = useMemo(
    () => (maxItems != null ? alerts.slice(0, maxItems) : alerts),
    [alerts, maxItems]
  );

  const renderItem = useCallback(
    ({ item }: { item: FarmAlert }) => (
      <AttentionCard alert={item} styles={styles} onPress={onPressAlert} />
    ),
    [styles, onPressAlert]
  );

  if (visible.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>⚠️ Needs Attention ({visible.length})</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={visible}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
      />
    </View>
  );
});

interface CardProps {
  alert: FarmAlert;
  styles: ReturnType<typeof createStyles>;
  onPress: (alert: FarmAlert) => void;
}

function AttentionCard({ alert, styles, onPress }: CardProps): React.JSX.Element {
  const handlePress = useCallback(() => onPress(alert), [onPress, alert]);
  const cardStyle =
    alert.severity === 'critical'
      ? styles.cardCritical
      : alert.severity === 'warning'
        ? styles.cardWarning
        : styles.cardInfo;
  const bubbleStyle =
    alert.severity === 'critical'
      ? styles.iconBubbleCritical
      : alert.severity === 'warning'
        ? styles.iconBubbleWarning
        : styles.iconBubbleInfo;

  return (
    <TouchableOpacity style={[styles.card, cardStyle]} activeOpacity={0.75} onPress={handlePress}>
      <View style={[styles.iconBubble, bubbleStyle]}>
        <Text style={styles.iconText}>{alert.icon}</Text>
      </View>
      <Text style={styles.title2} numberOfLines={1}>
        {alert.title}
      </Text>
      <Text style={styles.message} numberOfLines={2}>
        {alert.message}
      </Text>
    </TouchableOpacity>
  );
}

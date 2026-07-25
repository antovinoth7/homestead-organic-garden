/**
 * NeedsAttentionScroll (Phase C, C.8).
 *
 * Horizontal scroll of the actionable farm alerts, ordered most-urgent first.
 * Fed by `alerts.ts` (`getFarmAlerts(...).filter(isActionable)`) — no inline
 * alert logic. By default every actionable alert is shown so the header count
 * matches what's reachable; pass `maxItems` to cap. Tapping a card bubbles the
 * alert up so the screen can navigate. Alerts in `ALERT_COMPLETE_FIELD`
 * (fertilise, harvest) carry a quick ✓ complete action, and the seasonal
 * green-manure card an ✕ month-dismiss.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FarmAlert } from '@/types/database.types';
import { ALERT_COMPLETE_FIELD } from '@/services/alerts';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import { createStyles } from '@/styles/needsAttentionScrollStyles';

interface Props {
  alerts: FarmAlert[];
  onPressAlert: (alert: FarmAlert) => void;
  /** Quick-complete for fertilise/harvest alerts (stamps the care date as today). */
  onCompleteAlert?: (alert: FarmAlert) => void;
  /** Dismiss for the seasonal green-manure card (hides it for the month). */
  onDismissAlert?: (alert: FarmAlert) => void;
  /** Optional cap on cards shown. Defaults to showing all actionable alerts. */
  maxItems?: number;
}

const keyExtractor = (item: FarmAlert): string => item.id;

/** Past-tense verb for the ✓ chip's accessibility label, per completable type. */
const COMPLETE_VERB: Partial<Record<FarmAlert['type'], string>> = {
  fertilise_due: 'fertilised',
  harvest_due: 'harvested',
};

export const NeedsAttentionScroll = React.memo(function NeedsAttentionScroll({
  alerts,
  onPressAlert,
  onCompleteAlert,
  onDismissAlert,
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
      <AttentionCard
        alert={item}
        styles={styles}
        theme={theme}
        onPress={onPressAlert}
        onComplete={onCompleteAlert}
        onDismiss={onDismissAlert}
      />
    ),
    [styles, theme, onPressAlert, onCompleteAlert, onDismissAlert]
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
  theme: Theme;
  onPress: (alert: FarmAlert) => void;
  onComplete?: (alert: FarmAlert) => void;
  onDismiss?: (alert: FarmAlert) => void;
}

function AttentionCard({
  alert,
  styles,
  theme,
  onPress,
  onComplete,
  onDismiss,
}: CardProps): React.JSX.Element {
  const handlePress = useCallback(() => onPress(alert), [onPress, alert]);
  const handleComplete = useCallback(() => onComplete?.(alert), [onComplete, alert]);
  const handleDismiss = useCallback(() => onDismiss?.(alert), [onDismiss, alert]);
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

  const showComplete = !!ALERT_COMPLETE_FIELD[alert.type] && !!onComplete;
  const showDismiss = alert.type === 'bed_resting_end' && !!onDismiss;

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
      {showComplete && (
        <TouchableOpacity
          style={styles.actionChip}
          onPress={handleComplete}
          hitSlop={8}
          accessibilityLabel={`Mark ${alert.title} ${
            COMPLETE_VERB[alert.type] ?? 'done'
          } today`}
        >
          <Ionicons name="checkmark" size={14} color={theme.success} />
        </TouchableOpacity>
      )}
      {showDismiss && (
        <TouchableOpacity
          style={styles.actionChip}
          onPress={handleDismiss}
          hitSlop={8}
          accessibilityLabel="Dismiss green manure suggestion for this month"
        >
          <Ionicons name="close" size={14} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

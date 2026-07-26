/**
 * NeedsAttentionScroll — the "Falling behind" rail (Phase C, C.8).
 *
 * Horizontal scroll of the actionable farm alerts, ordered most-urgent first.
 * Fed by `alerts.ts` (`getFarmAlerts(...).filter(isActionable)`) — no inline
 * alert logic. Its job is the tail the hero's ring and per-type rows flatten
 * into a single number: the plants that have actually slipped, named. Work
 * merely due today is the ring's business, so an empty rail is the healthy
 * steady state and the component renders nothing.
 *
 * By default every actionable alert is shown so the header count matches what's
 * reachable; pass `maxItems` to cap. Tapping a card bubbles the alert up so the
 * screen can navigate. Cards backed by a task template carry a ✓ that completes
 * it for real (writing a `TaskLog`); the template-less harvest-readiness card
 * falls back to stamping `ALERT_COMPLETE_FIELD`.
 */

import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FarmAlert } from '@/types/database.types';
import { ALERT_COMPLETE_FIELD } from '@/services/alerts';
import { SectionHeader } from '@/components/SectionHeader';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/colors';
import { createStyles } from '@/styles/needsAttentionScrollStyles';

interface Props {
  alerts: FarmAlert[];
  onPressAlert: (alert: FarmAlert) => void;
  /** Quick-complete: marks the backing task done, or stamps the care date. */
  onCompleteAlert?: (alert: FarmAlert) => void;
  /** Optional cap on cards shown. Defaults to showing all actionable alerts. */
  maxItems?: number;
}

const keyExtractor = (item: FarmAlert): string => item.id;

/** Past-tense verb for the ✓ chip's accessibility label, per completable type. */
const COMPLETE_VERB: Partial<Record<FarmAlert['type'], string>> = {
  water_needed: 'watered',
  fertilise_due: 'fertilised',
  prune_due: 'pruned',
  harvest_due: 'harvested',
};

export const NeedsAttentionScroll = React.memo(function NeedsAttentionScroll({
  alerts,
  onPressAlert,
  onCompleteAlert,
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
      />
    ),
    [styles, theme, onPressAlert, onCompleteAlert]
  );

  if (visible.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeader title={`⚠️ Falling behind · ${visible.length}`} />
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
}

function AttentionCard({ alert, styles, theme, onPress, onComplete }: CardProps): React.JSX.Element {
  const handlePress = useCallback(() => onPress(alert), [onPress, alert]);
  const handleComplete = useCallback(() => onComplete?.(alert), [onComplete, alert]);
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

  // A task-backed card completes the task itself; the template-less harvest
  // card falls back to stamping the plant's care date.
  const showComplete = (!!alert.templateId || !!ALERT_COMPLETE_FIELD[alert.type]) && !!onComplete;

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
    </TouchableOpacity>
  );
}

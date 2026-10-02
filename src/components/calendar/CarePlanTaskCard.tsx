import React, { useCallback, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GardenIcon } from '@/components/GardenIcon';
import type { TaskTemplate } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanTaskCardStyles';
import { TASK_COLORS, TASK_LABELS } from '@/utils/taskConstants';
import type { TaskPriority } from '@/utils/careTaskFilters';
import { preferredTimeLabel, showPreferredTimeInMeta, taskBestTime } from '@/utils/taskTimeWindow';

/** How long a press must last to start selecting. */
export const SELECT_LONG_PRESS_MS = 450;

export type CarePlanCardDoneState = 'pending' | 'saved';

export interface CarePlanTaskCardProps {
  task: TaskTemplate;
  /** What the task is about — the plant, else the bed, else "General". */
  subject: string;
  /** Where, after the job and amount: " · Home Plot · Bed 2" (may be empty). */
  context: string;
  /** "Aug 20", or "3d late" when overdue. */
  dueText: string;
  overdue: boolean;
  priority: TaskPriority;
  /** One-word weather flag for the due day ("Rain" / "Wind"); the sheet has the advice. */
  advisoryText?: string | null;
  advisoryIcon?: VisualIconKey | null;
  harvestHint?: string | null;
  /** A long-press has started selecting: ticks pick cards instead of finishing them. */
  selectionMode: boolean;
  selected: boolean;
  /** Not due, and finishing it early would harm the plant — the tick explains. */
  blocked: boolean;
  /** Set for the Done today rows. Only a pending one can still be undone. */
  done?: CarePlanCardDoneState | null;
  /** False inside a time band, which already says when — the chip would repeat it. */
  showBestTime?: boolean;
  onPress: (task: TaskTemplate) => void;
  onLongPress: (task: TaskTemplate) => void;
  onTick: (task: TaskTemplate) => void;
}

function CarePlanTaskCardComponent({
  task,
  subject,
  context,
  dueText,
  overdue,
  priority,
  advisoryText,
  advisoryIcon,
  harvestHint,
  selectionMode,
  selected,
  blocked,
  done,
  showBestTime = true,
  onPress,
  onLongPress,
  onTick,
}: CarePlanTaskCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isDone = done != null;
  const label = TASK_LABELS[task.task_type];
  const amount = task.amount?.trim() ?? '';
  const bestTime = isDone || !showBestTime ? null : taskBestTime(task);
  const timeLabel = showPreferredTimeInMeta(task) ? preferredTimeLabel(task.preferred_time) : null;
  const barColor = overdue && !isDone ? theme.error : TASK_COLORS[task.task_type];
  const showBadge = !isDone && (priority === 'critical' || priority === 'high');

  const handlePress = useCallback(() => onPress(task), [onPress, task]);
  const handleLongPress = useCallback(() => onLongPress(task), [onLongPress, task]);
  const handleTick = useCallback(() => onTick(task), [onTick, task]);

  const tickLabel = isDone
    ? done === 'pending'
      ? `Undo ${label} ${subject}`
      : `${label} ${subject} done`
    : blocked
      ? `${label} ${subject} is not due yet — why?`
      : selectionMode
        ? `${selected ? 'Deselect' : 'Select'} ${label} ${subject}`
        : `Mark ${label} ${subject} done`;

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, selected && styles.cardSelected, isDone && styles.cardDone]}>
        <View style={[styles.bar, { backgroundColor: barColor }]} />
        <Pressable
          style={styles.body}
          onPress={handlePress}
          onLongPress={isDone ? undefined : handleLongPress}
          delayLongPress={SELECT_LONG_PRESS_MS}
          disabled={isDone}
          accessibilityRole="button"
          accessibilityLabel={`${subject}, ${label}${amount ? `, ${amount}` : ''}, ${dueText}`}
          accessibilityHint={
            selectionMode ? 'Adds to the selection' : 'Opens details. Hold to start selecting'
          }
          accessibilityState={{ selected }}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, isDone && styles.titleDone]} numberOfLines={1}>
              {subject}
            </Text>
            {showBadge && (
              <Text
                style={[
                  styles.badge,
                  priority === 'critical' ? styles.badgeCritical : styles.badgeHigh,
                ]}
              >
                {priority === 'critical' ? 'Critical' : 'High'}
              </Text>
            )}
            {!isDone && advisoryText && (
              <View style={styles.rainChip}>
                <GardenIcon
                  name={advisoryIcon ?? 'weather.rain'}
                  size={11}
                  color={theme.infoDark}
                />
                <Text style={styles.rainChipText} numberOfLines={1}>
                  {advisoryText}
                </Text>
              </View>
            )}
            <Text
              style={[
                styles.due,
                overdue && !isDone && styles.dueOverdue,
                isDone && styles.dueDone,
              ]}
            >
              {isDone ? 'Done' : dueText}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.meta} numberOfLines={1}>
              <Text style={styles.metaLabel}>{label}</Text>
              {amount ? <Text style={styles.metaAmount}>{` · ${amount}`}</Text> : null}
              {context}
              {timeLabel ? ` · ${timeLabel}` : ''}
            </Text>
            {bestTime && (
              <View
                style={[
                  styles.timeChip,
                  bestTime.tone === 'cool' ? styles.timeChipCool : styles.timeChipWarm,
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={11}
                  color={bestTime.tone === 'cool' ? theme.timeCoolText : theme.timeWarmText}
                />
                <Text
                  style={[
                    styles.timeChipText,
                    bestTime.tone === 'cool' ? styles.timeChipTextCool : styles.timeChipTextWarm,
                  ]}
                >
                  {bestTime.label}
                </Text>
              </View>
            )}
          </View>
          {!isDone && harvestHint ? (
            <View style={styles.hintRow}>
              <GardenIcon name="task.harvest" size={12} color={theme.success} />
              <Text style={styles.hintText} numberOfLines={1}>
                {harvestHint}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          style={[styles.tick, blocked && !isDone && styles.tickBlocked]}
          onPress={handleTick}
          disabled={done === 'saved'}
          accessibilityRole={selectionMode && !isDone ? 'checkbox' : 'button'}
          accessibilityState={{ checked: selectionMode ? selected : isDone }}
          accessibilityLabel={tickLabel}
        >
          {blocked && !isDone ? (
            <Ionicons name="ban-outline" size={26} color={theme.border} />
          ) : (
            <View
              style={[
                styles.tickRing,
                selectionMode && !isDone && styles.tickBox,
                selected && !isDone && styles.tickFilled,
                isDone && styles.tickDone,
              ]}
            >
              <Ionicons
                name="checkmark"
                size={16}
                color={
                  isDone || selected
                    ? theme.textInverse
                    : selectionMode
                      ? theme.card
                      : theme.borderDark
                }
              />
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Memoised: toggling one card's selection, or ticking one, re-renders that
 * card only. Every prop is a primitive or a stable callback from the screen.
 */
export const CarePlanTaskCard = React.memo(CarePlanTaskCardComponent);

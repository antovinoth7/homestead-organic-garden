import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GardenIcon } from '@/components/GardenIcon';
import { SheetHandle } from '@/components/SheetHandle';
import { TASK_ICON_KEYS } from '@/config/iconRegistry';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/taskDetailSheetStyles';
import type { TaskTemplate } from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
import type { TaskPriority } from '@/utils/careTaskFilters';
import { formatFarmDate } from '@/utils/farmDate';
import {
  EARLY_COMPLETION_BLOCK_REASON,
  TASK_COLORS,
  TASK_LABELS,
  TASK_PRIORITY_LABELS,
  taskPriorityColor,
} from '@/utils/taskConstants';
import { preferredTimeLabel, taskBestTime } from '@/utils/taskTimeWindow';
import { TASK_AMOUNT_MAX_LENGTH, sanitizeAmountText } from '@/utils/textSanitizer';

interface Props {
  task: TaskTemplate;
  /** The plant, else the bed, else "General". */
  subject: string;
  plotName: string | null;
  priority: TaskPriority;
  /** Whole days late, or null when it is not overdue. */
  overdueDays: number | null;
  /** Water cycles rarely run at the base interval — what this one is and why. */
  wateringCycle: { iconKey: VisualIconKey; text: string } | null;
  /** Full weather advice for the due day, when the forecast has any. */
  weatherNote: string | null;
  /** Not due yet and harmful to do early (water / fertilise / spray). */
  blocked: boolean;
  /** Not due yet, so Skip becomes Reschedule. */
  future: boolean;
  /** Space the floating tab bar and the device inset take at the bottom. */
  bottomPadding: number;
  onClose: () => void;
  onDone: () => void;
  onDoneWithNotes: () => void;
  onSkip: () => void;
  onSaveAmount: (amount: string | null) => Promise<void>;
}

/**
 * Tap a card to get here: what the job is, how much, when best to do it, and
 * Done / Skip. "Done with notes…" opens the full completion form for the
 * quantity, product and labour the one-tap tick does not ask for.
 */
export function TaskDetailSheet({
  task,
  subject,
  plotName,
  priority,
  overdueDays,
  wateringCycle,
  weatherNote,
  blocked,
  future,
  bottomPadding,
  onClose,
  onDone,
  onDoneWithNotes,
  onSkip,
  onSaveAmount,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const keyboardHeight = useKeyboardHeight();
  const [editingAmount, setEditingAmount] = useState(false);
  const [amountDraft, setAmountDraft] = useState(task.amount ?? '');
  const [savingAmount, setSavingAmount] = useState(false);

  // A different task opening the sheet starts a fresh, closed editor.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on task change
    setEditingAmount(false);
    setAmountDraft(task.amount ?? '');
  }, [task.id, task.amount]);

  const label = TASK_LABELS[task.task_type];
  const color = TASK_COLORS[task.task_type];
  const bestTime = taskBestTime(task);
  const timeLabel = preferredTimeLabel(task.preferred_time);
  const amount = task.amount?.trim() ?? '';

  const startEditing = useCallback(() => {
    setAmountDraft(task.amount ?? '');
    setEditingAmount(true);
  }, [task.amount]);

  const saveAmount = useCallback(async () => {
    if (savingAmount) return;
    setSavingAmount(true);
    try {
      await onSaveAmount(amountDraft.trim() || null);
      setEditingAmount(false);
    } catch {
      // The screen has already said why; the editor stays open to retry.
    } finally {
      setSavingAmount(false);
    }
  }, [amountDraft, onSaveAmount, savingAmount]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close task details"
      />
      <View style={[styles.sheet, { paddingBottom: bottomPadding + keyboardHeight }]}>
        <SheetHandle onClose={onClose} />
        <View style={styles.header}>
          <View style={[styles.iconTile, { backgroundColor: `${color}18` }]}>
            <GardenIcon name={TASK_ICON_KEYS[task.task_type]} size={30} color={color} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.title} numberOfLines={1}>
              {subject}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {label}
              {plotName ? ` · ${plotName}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.valueBlock}>
              <Text style={styles.value}>
                {task.frequency_days > 0
                  ? `Every ${task.frequency_days} day${task.frequency_days !== 1 ? 's' : ''}`
                  : 'One time'}
              </Text>
              {wateringCycle && (
                <View style={styles.noteLine}>
                  <GardenIcon name={wateringCycle.iconKey} size={12} color={theme.textTertiary} />
                  <Text style={styles.note}>{wateringCycle.text}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            {editingAmount ? (
              <View style={styles.amountEditor}>
                <TextInput
                  style={styles.amountInput}
                  value={amountDraft}
                  onChangeText={(text) => setAmountDraft(sanitizeAmountText(text))}
                  placeholder="e.g. 2 kg compost"
                  placeholderTextColor={theme.inputPlaceholder}
                  maxLength={TASK_AMOUNT_MAX_LENGTH}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveAmount}
                  accessibilityLabel="Amount"
                />
                <TouchableOpacity
                  style={styles.amountSave}
                  onPress={saveAmount}
                  disabled={savingAmount}
                  accessibilityRole="button"
                  accessibilityLabel="Save amount"
                >
                  <Text style={styles.amountSaveText}>{savingAmount ? '…' : 'Save'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.valueBlock}
                onPress={startEditing}
                accessibilityRole="button"
                accessibilityLabel={amount ? `Amount ${amount}. Edit` : 'Add an amount'}
              >
                <Text style={[styles.value, !amount && styles.valueAction]}>
                  {amount || 'Add amount'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {bestTime ? (
            <View style={styles.row}>
              <Text style={styles.label}>Best time</Text>
              <View style={styles.valueBlock}>
                <Text style={styles.value}>{bestTime.label}</Text>
                <Text style={styles.note}>{bestTime.reason}</Text>
              </View>
            </View>
          ) : timeLabel ? (
            <View style={styles.row}>
              <Text style={styles.label}>Preferred Time</Text>
              <View style={styles.valueBlock}>
                <Text style={styles.value}>{timeLabel}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.row}>
            <Text style={styles.label}>Due</Text>
            <View style={styles.valueBlock}>
              <Text style={[styles.value, overdueDays !== null && styles.valueOverdue]}>
                {overdueDays !== null
                  ? `${overdueDays}d overdue`
                  : formatFarmDate(new Date(task.next_due_at), {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.valueBlock}>
              <Text style={[styles.value, { color: taskPriorityColor(theme, priority) }]}>
                {TASK_PRIORITY_LABELS[priority]}
              </Text>
            </View>
          </View>

          {weatherNote ? (
            <View style={styles.row}>
              <Text style={styles.label}>Weather</Text>
              <View style={styles.valueBlock}>
                <Text style={[styles.value, styles.valueInfo]}>{weatherNote}</Text>
              </View>
            </View>
          ) : null}

          {task.last_skipped_at ? (
            <View style={styles.row}>
              <Text style={styles.label}>
                Skipped{(task.skip_count ?? 0) > 1 ? ` ×${task.skip_count}` : ''}
              </Text>
              <View style={styles.valueBlock}>
                <Text style={[styles.value, styles.valueWarning]}>
                  {formatFarmDate(new Date(task.last_skipped_at), {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {task.last_skip_reason ? ` · ${task.last_skip_reason}` : ''}
                </Text>
              </View>
            </View>
          ) : null}

          {blocked ? (
            <View style={styles.row}>
              <Text style={styles.label}>Not due yet</Text>
              <View style={styles.valueBlock}>
                <Text style={[styles.value, styles.valueWarning]}>
                  {EARLY_COMPLETION_BLOCK_REASON[task.task_type]}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionDone]}
            onPress={onDone}
            accessibilityRole="button"
            accessibilityLabel={`Mark ${label} ${subject} done`}
          >
            <Ionicons name="checkmark" size={16} color={theme.textInverse} />
            <Text style={styles.actionText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionSkip]}
            onPress={onSkip}
            accessibilityRole="button"
          >
            <Ionicons
              name={future ? 'calendar-outline' : 'play-skip-forward'}
              size={16}
              color={theme.textInverse}
            />
            <Text style={styles.actionText}>{future ? 'Reschedule' : 'Skip'}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.notesLink}
          onPress={onDoneWithNotes}
          accessibilityRole="button"
          accessibilityHint="Opens the completion form for notes, quantity and labour"
        >
          <Text style={styles.notesLinkText}>Done with notes…</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

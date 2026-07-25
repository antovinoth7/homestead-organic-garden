import React from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '../BottomSheetModal';
import VoiceDictation from '@/components/VoiceDictation';
import { TaskTemplate } from '../../types/database.types';
import { computeSkipDate } from '../../services/taskSchedulingLogic';
import { createStyles } from '../../styles/calendarStyles';
import { useTheme } from '../../theme';

const SKIP_DAY_OPTIONS = [
  { days: 1, label: 'Tomorrow' },
  { days: 3, label: '3 Days' },
  { days: 7, label: '7 Days' },
] as const;

const SKIP_REASON_PRESETS = ['Weather', 'Already done', 'Not needed', 'Too busy'] as const;

interface SkipTaskModalProps {
  visible: boolean;
  /** Single-task skip. Null when skipping a multi-select batch. */
  task: TaskTemplate | null;
  /** Number of tasks being skipped — 1 for the single-task path. */
  taskCount: number;
  /** Not-yet-due tasks dropped from the batch, so the sheet can say so. */
  excludedCount?: number;
  skipDays: number;
  skipReason: string;
  isSkipping: boolean;
  styles: ReturnType<typeof createStyles>;
  bottomInset: number;
  onChangeDays: (days: number) => void;
  onChangeReason: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function SkipTaskModal({
  visible,
  task,
  taskCount,
  excludedCount = 0,
  skipDays,
  skipReason,
  isSkipping,
  styles,
  bottomInset,
  onChangeDays,
  onChangeReason,
  onClose,
  onConfirm,
}: SkipTaskModalProps): React.JSX.Element {
  const theme = useTheme();

  // Only meaningful for a single task — a batch has one new date per task.
  const previewDate = task
    ? computeSkipDate(task, skipDays).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={styles.modalContent}
      keyboardAvoiding
      dismissOnBackdropPress={!isSkipping}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={onClose}
          disabled={isSkipping}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={theme.textInverse} />
        </TouchableOpacity>
        <View style={styles.modalTitleWrap}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {taskCount > 1 ? `Skip ${taskCount} Tasks` : 'Skip Task'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.modalSaveButton, isSkipping && styles.modalSaveButtonDisabled]}
          onPress={onConfirm}
          disabled={isSkipping}
          activeOpacity={0.85}
        >
          <Text style={[styles.modalSaveText, isSkipping && styles.modalSaveTextDisabled]}>
            {isSkipping ? 'Skipping...' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modalScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Math.max(bottomInset, 12) }}
      >
        <View style={styles.modalBody}>
          <Text style={styles.skipModalSubtext}>Postpone by:</Text>
          <View style={styles.skipDaysRow}>
            {SKIP_DAY_OPTIONS.map(({ days, label }) => (
              <TouchableOpacity
                key={days}
                style={[styles.skipDayChip, skipDays === days && styles.skipDayChipActive]}
                onPress={() => onChangeDays(days)}
                accessibilityRole="button"
                accessibilityState={{ selected: skipDays === days }}
              >
                <Text
                  style={[
                    styles.skipDayChipText,
                    skipDays === days && styles.skipDayChipTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {previewDate && (
            <Text style={styles.skipPreviewText}>
              Rescheduled to {previewDate}, 6:00 PM
            </Text>
          )}

          {excludedCount > 0 && (
            <Text style={styles.skipPreviewText}>
              {excludedCount} not-yet-due task{excludedCount === 1 ? '' : 's'} will be left alone.
            </Text>
          )}

          <VoiceDictation value={skipReason} onChangeText={onChangeReason} />
          <TextInput
            style={styles.skipModalInput}
            placeholder="Reason (optional)"
            value={skipReason}
            onChangeText={onChangeReason}
            placeholderTextColor={theme.textTertiary}
            multiline
          />

          <View style={styles.skipReasonChips}>
            {SKIP_REASON_PRESETS.map((reason) => {
              const active = skipReason === reason;
              return (
                <TouchableOpacity
                  key={reason}
                  style={[styles.skipReasonChip, active && styles.skipReasonChipActive]}
                  onPress={() => onChangeReason(active ? '' : reason)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text
                    style={[styles.skipReasonChipText, active && styles.skipReasonChipTextActive]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

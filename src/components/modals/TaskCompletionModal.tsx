import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '../BottomSheetModal';
import FloatingLabelInput from '../FloatingLabelInput';
import VoiceDictation from '@/components/VoiceDictation';
import { TaskTemplate } from '../../types/database.types';
import { createStyles } from '../../styles/calendarStyles';
import { useTheme } from '../../theme';

interface TaskCompletionModalProps {
  visible: boolean;
  task: TaskTemplate | null;
  taskNotes: string;
  productUsed: string;
  isCompleting: boolean;
  plantName: string;
  styles: ReturnType<typeof createStyles>;
  bottomInset: number;
  onChangeNotes: (text: string) => void;
  onChangeProduct: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TaskCompletionModal({
  visible,
  task,
  taskNotes,
  productUsed,
  isCompleting,
  plantName,
  styles,
  bottomInset,
  onChangeNotes,
  onChangeProduct,
  onClose,
  onConfirm,
}: TaskCompletionModalProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={styles.modalContent}
      keyboardAvoiding
      dismissOnBackdropPress={!isCompleting}
    >
      <View style={styles.modalHeader}>
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={onClose}
          disabled={isCompleting}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={theme.textInverse} />
        </TouchableOpacity>
        <View style={styles.modalTitleWrap}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            Complete Task
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.modalSaveButton, isCompleting && styles.modalSaveButtonDisabled]}
          onPress={onConfirm}
          disabled={isCompleting}
          activeOpacity={0.85}
        >
          <Text style={[styles.modalSaveText, isCompleting && styles.modalSaveTextDisabled]}>
            {isCompleting ? 'Saving...' : 'Done'}
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
          {task && (
            <View style={styles.selectedTaskInfo}>
              <Text style={styles.selectedTaskTitle}>
                {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
              </Text>
              <Text style={styles.selectedTaskPlant}>{plantName}</Text>
            </View>
          )}

          <VoiceDictation value={taskNotes} onChangeText={onChangeNotes} />
          <FloatingLabelInput
            label="Notes (Optional)"
            value={taskNotes}
            onChangeText={onChangeNotes}
            multiline
            numberOfLines={3}
          />

          <FloatingLabelInput
            label="Product Used (Optional)"
            value={productUsed}
            onChangeText={onChangeProduct}
          />
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

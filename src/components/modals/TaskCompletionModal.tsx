import React, { useEffect, useState } from 'react';
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
  earlyCompletion: boolean;
  completionReason: string;
  inputQuantity: string;
  inputUnit: string;
  treatedArea: string;
  areaUnit: string;
  labourMinutes: string;
  isCompleting: boolean;
  plantName: string;
  styles: ReturnType<typeof createStyles>;
  bottomInset: number;
  onChangeNotes: (text: string) => void;
  onChangeProduct: (text: string) => void;
  onChangeCompletionReason: (text: string) => void;
  onChangeInputQuantity: (text: string) => void;
  onChangeInputUnit: (text: string) => void;
  onChangeTreatedArea: (text: string) => void;
  onChangeAreaUnit: (text: string) => void;
  onChangeLabourMinutes: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TaskCompletionModal({
  visible,
  task,
  taskNotes,
  productUsed,
  earlyCompletion,
  completionReason,
  inputQuantity,
  inputUnit,
  treatedArea,
  areaUnit,
  labourMinutes,
  isCompleting,
  plantName,
  styles,
  bottomInset,
  onChangeNotes,
  onChangeProduct,
  onChangeCompletionReason,
  onChangeInputQuantity,
  onChangeInputUnit,
  onChangeTreatedArea,
  onChangeAreaUnit,
  onChangeLabourMinutes,
  onClose,
  onConfirm,
}: TaskCompletionModalProps): React.JSX.Element {
  const theme = useTheme();
  const [showFarmDetails, setShowFarmDetails] = useState(false);

  useEffect(() => {
    if (!visible) setShowFarmDetails(false);
  }, [visible]);
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

          {earlyCompletion && (
            <>
              <View style={styles.earlyCompletionNotice}>
                <Ionicons name="alert-circle-outline" size={18} color={theme.warning} />
                <Text style={styles.earlyCompletionNoticeText}>
                  This work is ahead of the planned date. Record what you observed so the change
                  remains auditable.
                </Text>
              </View>
              <FloatingLabelInput
                label="Field reason *"
                value={completionReason}
                onChangeText={onChangeCompletionReason}
                multiline
                numberOfLines={2}
              />
            </>
          )}

          <VoiceDictation value={taskNotes} onChangeText={onChangeNotes} />
          <FloatingLabelInput
            label="Field observation (Optional)"
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

          <TouchableOpacity
            style={styles.farmDetailsToggle}
            onPress={() => setShowFarmDetails((current) => !current)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showFarmDetails }}
            accessibilityLabel="Optional farm details"
          >
            <Text style={styles.farmDetailsToggleText}>Farm details (optional)</Text>
            <Ionicons
              name={showFarmDetails ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {showFarmDetails && (
            <View style={styles.farmDetailsFields}>
              <View style={styles.farmDetailsRow}>
                <View style={styles.farmDetailsField}>
                  <FloatingLabelInput
                    label="Input quantity"
                    value={inputQuantity}
                    onChangeText={onChangeInputQuantity}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.farmDetailsField}>
                  <FloatingLabelInput
                    label="Unit"
                    value={inputUnit}
                    onChangeText={onChangeInputUnit}
                  />
                </View>
              </View>
              <View style={styles.farmDetailsRow}>
                <View style={styles.farmDetailsField}>
                  <FloatingLabelInput
                    label="Treated area"
                    value={treatedArea}
                    onChangeText={onChangeTreatedArea}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.farmDetailsField}>
                  <FloatingLabelInput
                    label="Area unit"
                    value={areaUnit}
                    onChangeText={onChangeAreaUnit}
                  />
                </View>
              </View>
              <FloatingLabelInput
                label="Labour time (minutes)"
                value={labourMinutes}
                onChangeText={onChangeLabourMinutes}
                keyboardType="number-pad"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

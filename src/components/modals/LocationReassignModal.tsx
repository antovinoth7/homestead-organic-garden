import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ThemedDropdown from '@/components/ThemedDropdown';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/locationModalStyles';
import type { ReassignModalState } from '@/hooks/useLocationManager';

interface Props {
  reassignModal: ReassignModalState | null;
  reassignOptions: string[];
  reassignCount: number;
  onConfirm: () => void;
  onClose: () => void;
  onReplacementChange: (value: string) => void;
}

export function LocationReassignModal({
  reassignModal,
  reassignOptions,
  reassignCount,
  onConfirm,
  onClose,
  onReplacementChange,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={!!reassignModal}
      transparent
      animationType="fade"
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Move Plants & Delete</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalHint}>
            This location is used by {reassignCount} plant
            {reassignCount === 1 ? '' : 's'}. Choose a replacement.
          </Text>

          <ThemedDropdown
            items={reassignOptions.map((option) => ({ label: option, value: option }))}
            selectedValue={reassignModal?.replacement ?? ''}
            onValueChange={onReplacementChange}
            label="Replacement location"
            placeholder="Replacement location"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonDanger]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonTextPrimary}>Move & Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

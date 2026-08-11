import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogPlantDetailStyles';

interface OptionProps {
  option: string;
  active: boolean;
  onSelect: (option: string) => void;
}

function ReassignOption({ option, active, onSelect }: OptionProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const handlePress = useCallback(() => onSelect(option), [onSelect, option]);

  return (
    <TouchableOpacity
      style={[styles.reassignItem, active && styles.reassignItemActive]}
      onPress={handlePress}
    >
      <Text style={[styles.reassignText, active && styles.reassignTextActive]}>{option}</Text>
    </TouchableOpacity>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
  /** The entry being deleted. */
  plantName: string;
  usageCount: number;
  /** Other catalog entries in this category that plants can move to. */
  options: readonly string[];
  selected: string;
  onSelect: (option: string) => void;
  onConfirm: () => void;
}

/**
 * Deleting an entry that garden plants depend on requires somewhere to move
 * them, so this picks the replacement before the delete goes through.
 */
export function ReassignPlantsModal({
  visible,
  onClose,
  plantName,
  usageCount,
  options,
  selected,
  onSelect,
  onConfirm,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Move Plants &amp; Delete</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={16} color={theme.textInverse} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalHint}>
            {usageCount} plant{usageCount === 1 ? '' : 's'} use &quot;{plantName}&quot;. Select a
            replacement.
          </Text>
          <View style={styles.reassignList}>
            {options.map((option) => (
              <ReassignOption
                key={option}
                option={option}
                active={selected === option}
                onSelect={onSelect}
              />
            ))}
          </View>
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
              <Text style={styles.modalButtonTextPrimary}>Move &amp; Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

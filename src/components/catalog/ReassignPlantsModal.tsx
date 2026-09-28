import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
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
  /** '' until the user picks — nothing is pre-selected, so one tap can't misfile every plant. */
  selected: string;
  /** Bundled entries are hidden rather than deleted, and the wording says so. */
  deleteKind: 'hide' | 'remove';
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
  deleteKind,
  onSelect,
  onConfirm,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const verb = deleteKind === 'hide' ? 'Hide' : 'Delete';
  const canConfirm = selected !== '';

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
            <Text style={styles.modalTitle}>Move plants &amp; {verb.toLowerCase()}</Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={16} color={theme.textInverse} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalHint}>
            {usageCount} garden plant{usageCount === 1 ? '' : 's'} use &quot;{plantName}&quot;.
            Pick the plant to move {usageCount === 1 ? 'it' : 'them'} to.
          </Text>
          <ScrollView style={styles.reassignScroll} contentContainerStyle={styles.reassignList}>
            {options.map((option) => (
              <ReassignOption
                key={option}
                option={option}
                active={selected === option}
                onSelect={onSelect}
              />
            ))}
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalButtonDanger,
                !canConfirm && styles.modalButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={!canConfirm}
              accessibilityState={{ disabled: !canConfirm }}
            >
              <Text style={styles.modalButtonTextPrimary}>Move &amp; {verb.toLowerCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

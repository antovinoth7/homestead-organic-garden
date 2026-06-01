import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/bedDeleteModalStyles';

interface Props {
  visible: boolean;
  bedName: string;
  activePlantCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function BedDeleteModal({
  visible,
  bedName,
  activePlantCount,
  onCancel,
  onConfirm,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const plantLabel = `${activePlantCount} active plant${activePlantCount === 1 ? '' : 's'}`;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="trash-outline" size={30} color={theme.error} />
          </View>

          <Text style={styles.title}>Delete “{bedName}”?</Text>
          <Text style={styles.message}>
            This bed has {plantLabel}. Deleting the bed will remove {activePlantCount === 1 ? 'it' : 'them'} too.
            This can’t be undone after the toast disappears.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Delete bed and its plants"
            >
              <Ionicons name="trash-outline" size={18} color={theme.textInverse} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

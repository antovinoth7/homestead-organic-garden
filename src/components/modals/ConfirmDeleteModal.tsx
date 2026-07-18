import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/confirmDeleteModalStyles';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** While true the delete is in flight: buttons disable and the confirm shows a spinner. */
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Reusable themed delete-confirmation dialog (matches the Beds delete dialog). */
export function ConfirmDeleteModal({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  busy = false,
  onCancel,
  onConfirm,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Block backdrop dismiss while a delete is running so it can't be cancelled mid-flight.
  const handleRequestClose = (): void => {
    if (!busy) onCancel();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="trash-outline" size={30} color={theme.error} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, busy && styles.disabledButton]}
              onPress={onCancel}
              activeOpacity={0.8}
              disabled={busy}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelButtonText} numberOfLines={1}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton, busy && styles.disabledButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy, busy }}
              accessibilityLabel={confirmLabel}
            >
              {busy && <ActivityIndicator size="small" color={theme.textInverse} />}
              <Text style={styles.deleteButtonText} numberOfLines={1}>
                {busy ? 'Deleting…' : confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

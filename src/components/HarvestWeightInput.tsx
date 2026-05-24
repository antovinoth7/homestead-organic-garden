import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  onConfirm: (kg: number) => void;
  onDismiss: () => void;
}

export function HarvestWeightInput({ onConfirm, onDismiss }: Props): React.JSX.Element {
  const theme = useTheme();
  const [value, setValue] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: theme.overlay,
          justifyContent: 'center',
          alignItems: 'center',
        },
        card: {
          backgroundColor: theme.backgroundSecondary,
          borderRadius: 12,
          padding: 24,
          width: 280,
          shadowColor: theme.shadow,
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        },
        title: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
        inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
        input: {
          flex: 1,
          borderWidth: 1,
          borderRadius: 8,
          padding: 10,
          fontSize: 18,
          color: theme.text,
          borderColor: theme.border,
          backgroundColor: theme.background,
        },
        unit: { fontSize: 16, color: theme.text, marginLeft: 8 },
        buttonRow: { flexDirection: 'row', gap: 12 },
        cancelButton: {
          flex: 1,
          padding: 12,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: theme.border,
          alignItems: 'center',
        },
        confirmButton: {
          flex: 1,
          padding: 12,
          borderRadius: 8,
          backgroundColor: theme.primary,
          alignItems: 'center',
        },
        cancelText: { color: theme.textSecondary },
        confirmText: { color: theme.textInverse, fontWeight: '600' },
      }),
    [theme]
  );

  const handleConfirm = (): void => {
    const kg = parseFloat(value);
    if (!isNaN(kg) && kg > 0) onConfirm(kg);
    else onDismiss();
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onDismiss}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.title}>Log Harvest Weight</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder="0.0"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              style={styles.input}
            />
            <Text style={styles.unit}>kg</Text>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onDismiss} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Save</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

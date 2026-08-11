import React, { useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/sectionSheetStyles';
import type { EditModalState } from '@/hooks/useLocationManager';

interface Props {
  editModal: EditModalState | null;
  editCount: number;
  saving: boolean;
  childLocations: string[];
  onSave: () => void;
  onClose: () => void;
  onChangeValue: (text: string) => void;
}

/** Offered as one-tap fills when creating a section; already-added ones drop out. */
const QUICK_DIRECTIONS = ['North', 'South', 'East', 'West'] as const;

/**
 * Create/rename sheet for a section — a name and nothing else, so it stays a
 * bottom sheet rather than taking over the screen like the plot editor does.
 */
export function SectionEditSheet({
  editModal,
  editCount,
  saving,
  childLocations,
  onSave,
  onClose,
  onChangeValue,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const visible = editModal?.type === 'child';
  const isNew = editModal?.original === '';
  const value = editModal?.value ?? '';

  const quickAdds = useMemo(
    () =>
      isNew
        ? QUICK_DIRECTIONS.filter(
            (d) => !childLocations.some((c) => c.toLowerCase() === d.toLowerCase())
          )
        : [],
    [isNew, childLocations]
  );

  const handleQuickAdd = useCallback(
    (direction: string) => onChangeValue(direction),
    [onChangeValue]
  );

  const saveDisabled = saving || value.trim() === '';

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      sheetStyle={styles.sheet}
      keyboardAvoiding
      dismissOnBackdropPress={!saving}
    >
      <SheetHandle onClose={onClose} />

      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{isNew ? 'New section' : 'Rename section'}</Text>
          <Text style={styles.subtitle}>A direction or zone shared across plots</Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={theme.textInverse} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeValue}
        placeholder="Front Yard"
        placeholderTextColor={theme.inputPlaceholder}
        autoCorrect={false}
        selectionColor={theme.primary}
      />

      <Text style={styles.usageLine}>
        Used by {editCount} plant{editCount === 1 ? '' : 's'}.
      </Text>

      {quickAdds.length > 0 && (
        <View style={styles.quickRow}>
          <Text style={styles.quickLabel}>Quick add</Text>
          {quickAdds.map((direction) => (
            <TouchableOpacity
              key={direction}
              style={styles.quickChip}
              onPress={() => handleQuickAdd(direction)}
            >
              <Text style={styles.quickChipText}>{direction}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={saveDisabled}
          activeOpacity={0.85}
        >
          <Text style={[styles.saveButtonText, saveDisabled && styles.saveButtonTextDisabled]}>
            Save section
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

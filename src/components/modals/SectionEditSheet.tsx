import React, { useCallback, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}
      keyboardAvoiding
      dismissOnBackdropPress={!saving}
    >
      <SheetHandle onClose={onClose} />

      {/* Close left, save right — the plot editor's header layout. Save used to
          sit in a footer, where the translucent nav bar covered it. */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={theme.textInverse} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {isNew ? 'New section' : 'Rename section'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            A direction or zone shared across plots
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saveDisabled && styles.saveButtonDisabled]}
          onPress={onSave}
          disabled={saveDisabled}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Save section"
        >
          <Text style={[styles.saveButtonText, saveDisabled && styles.saveButtonTextDisabled]}>
            Save
          </Text>
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
    </BottomSheetModal>
  );
}

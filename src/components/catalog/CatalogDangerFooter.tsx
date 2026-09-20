import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/catalogDangerStyles';

interface Props {
  /** Hidden when the entry has no overrides to reset, or is being created. */
  showReset: boolean;
  onReset: () => void;
  onDelete: () => void;
  /** Garden plants using this entry — drives the safety note under Delete. */
  usageCount: number;
  disabled?: boolean;
}

/**
 * Reset and Delete, at the end of the last section group.
 *
 * The note under Delete states the consequence up front: deleting an entry
 * that garden plants depend on forces a reassignment, and knowing that before
 * the tap is better than discovering it in a modal.
 */
export function CatalogDangerFooter({
  showReset,
  onReset,
  onDelete,
  usageCount,
  disabled = false,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const safetyNote =
    usageCount > 0
      ? `Used by ${usageCount} garden plant${usageCount === 1 ? '' : 's'} — you'll be asked to move ${usageCount === 1 ? 'it' : 'them'} first.`
      : 'Not used by any garden plant — deleting is safe.';

  return (
    <View style={styles.container}>
      {showReset && (
        <TouchableOpacity
          style={styles.resetRow}
          onPress={onReset}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={17} color={theme.textSecondary} />
          <Text style={styles.resetText}>Reset to app defaults</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.deleteRow}
        onPress={onDelete}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={17} color={theme.error} />
        <Text style={styles.deleteText}>Delete this catalog entry</Text>
      </TouchableOpacity>
      <Text style={styles.safetyNote}>{safetyNote}</Text>
    </View>
  );
}

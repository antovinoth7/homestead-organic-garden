import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/journalSheetStyles';
import { BottomSheetModal } from '@/components/BottomSheetModal';
import { SheetHandle } from '@/components/SheetHandle';

interface Props {
  visible: boolean;
  /** The entry's headline or the start of its notes. */
  title: string;
  /** Offer "Mark resolved" — only for an open pest/disease entry. */
  canResolve: boolean;
  onResolve: () => void;
  onEdit: () => void;
  /** Runs after the in-sheet confirmation. */
  onDelete: () => void;
  onClose: () => void;
}

/**
 * The entry card's ⋯ menu: Mark resolved (open problems only), Edit, Delete.
 * Delete swaps the menu for a confirmation in place, so there is no second
 * modal stacked on the first.
 */
export function JournalActionSheet({
  visible,
  title,
  canResolve,
  onResolve,
  onEdit,
  onDelete,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [confirming, setConfirming] = useState(false);

  // Every exit resets the confirmation, so the next entry opens on the menu.
  const close = useCallback((): void => {
    setConfirming(false);
    onClose();
  }, [onClose]);
  const askDelete = useCallback((): void => setConfirming(true), []);
  const confirmDelete = useCallback((): void => {
    setConfirming(false);
    onDelete();
  }, [onDelete]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={close}
      sheetStyle={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}
    >
      <SheetHandle onClose={close} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {confirming ? 'Delete entry?' : title}
        </Text>
        {confirming ? (
          <>
            <Text style={styles.message}>
              This journal entry will be permanently removed. This can&apos;t be undone.
            </Text>
            <TouchableOpacity
              style={[styles.actionRow, styles.actionRowDanger]}
              onPress={confirmDelete}
              accessibilityRole="button"
            >
              <Text
                style={[styles.actionText, styles.actionTextOnPrimary, styles.actionTextCentered]}
              >
                Delete entry
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostButton} onPress={close} accessibilityRole="button">
              <Text style={styles.ghostButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {canResolve && (
              <TouchableOpacity
                style={[styles.actionRow, styles.actionRowPrimary]}
                onPress={onResolve}
                accessibilityRole="button"
              >
                <Ionicons name="checkmark" size={20} color={theme.textInverse} />
                <Text style={[styles.actionText, styles.actionTextOnPrimary]}>Mark resolved</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionRow} onPress={onEdit} accessibilityRole="button">
              <Ionicons name="create-outline" size={20} color={theme.text} />
              <Text style={styles.actionText}>Edit entry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={askDelete}
              accessibilityRole="button"
            >
              <Ionicons name="trash-outline" size={20} color={theme.errorDark} />
              <Text style={[styles.actionText, styles.actionTextDanger]}>Delete</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </BottomSheetModal>
  );
}

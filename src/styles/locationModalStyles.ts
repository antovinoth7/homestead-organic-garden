import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/**
 * Centered-dialog chrome for `LocationReassignModal`.
 *
 * The plot editor and the soil chip groups moved to `plotEditStyles.ts`, and the
 * section sheet to `sectionSheetStyles.ts`, when My Farm was redesigned; only
 * the reassign dialog still draws from here.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalHint: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: 10,
    },
    modalButtonSecondary: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonDanger: {
      backgroundColor: theme.error,
    },
    modalButtonTextSecondary: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    modalButtonTextPrimary: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textInverse,
    },
  });

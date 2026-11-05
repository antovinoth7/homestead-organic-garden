import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

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
      borderRadius: radius(theme, 'card', 16),
      padding: 20,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      ...shadow(theme, 'card'),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: radius(theme, 'iconButton', 16),
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
      ...font(theme, 'body'),
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
      borderRadius: radius(theme, 'button', 10),
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
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    modalButtonTextPrimary: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyStrong', '600'),
    },
  });

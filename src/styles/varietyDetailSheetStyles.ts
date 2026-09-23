import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Bottom sheet card; the height cap keeps the header in frame however far
    // the keyboard padding pushes the sheet up.
    sheet: {
      backgroundColor: theme.backgroundSecondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
    },
    /** Shared editor bar: close left, title centre, Done right. */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 8,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    doneButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 20,
    },
    doneText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textInverse,
    },
    // Shrinks (rather than pushing the header off) when the sheet is clamped
    // to maxHeight or the keyboard reduces the available space.
    scroll: {
      flexShrink: 1,
    },
    scrollContent: {
      padding: 20,
    },
    fieldLabel: {
      fontSize: 12,
      color: theme.textTertiary,
      marginBottom: 6,
    },
    seasonPillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    seasonPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    seasonPillActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    seasonPillText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    seasonPillTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    notesInput: {
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 8,
      padding: 10,
      minHeight: 72,
      color: theme.text,
      fontSize: 14,
      textAlignVertical: 'top',
      backgroundColor: theme.backgroundSecondary,
      marginBottom: 4,
    },
  });

import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/** Styles for `SectionEditSheet` — the create/rename bottom sheet for sections. */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 20,
    },
    header: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 21,
      fontWeight: '700',
      color: theme.text,
    },
    subtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginTop: 2,
    },
    // The app's shared close treatment — 36px primary circle, white glyph — as
    // used by every other sheet and modal header (Create task, plant form).
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginTop: 20,
    },
    input: {
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.primary,
      borderRadius: 13,
      paddingHorizontal: 15,
      paddingVertical: 14,
      marginTop: 8,
      fontSize: 16,
      fontWeight: '600',
      color: theme.inputText,
    },
    usageLine: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginTop: 10,
    },
    quickRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 14,
    },
    quickLabel: {
      fontSize: 11.5,
      color: theme.textTertiary,
    },
    quickChip: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 9,
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    quickChipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.primary,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 20,
    },
    saveButton: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 15,
      paddingVertical: 15,
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 4,
    },
    saveButtonDisabled: {
      backgroundColor: theme.borderDark,
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      fontSize: 15.5,
      fontWeight: '700',
      color: theme.textInverse,
    },
    saveButtonTextDisabled: {
      color: theme.textTertiary,
    },
  });

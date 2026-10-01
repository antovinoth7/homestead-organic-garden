import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/** The Care Plan's task detail sheet — subject first, then the facts, then Done / Skip. */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
      zIndex: 1000,
      elevation: 1000,
    },
    sheet: {
      backgroundColor: theme.backgroundSecondary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    iconTile: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    body: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 44,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    label: {
      flexShrink: 0,
      fontSize: 13,
      fontWeight: '500',
      color: theme.textSecondary,
    },
    // Value over its explanatory note, right-aligned against the label.
    valueBlock: {
      flex: 1,
      marginLeft: 16,
      alignItems: 'flex-end',
      gap: 3,
    },
    value: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'right',
    },
    valueOverdue: {
      color: theme.error,
    },
    valueWarning: {
      color: theme.warning,
    },
    valueAction: {
      color: theme.primary,
    },
    noteLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    note: {
      flexShrink: 1,
      fontSize: 11,
      fontWeight: '500',
      color: theme.textTertiary,
      textAlign: 'right',
    },
    amountEditor: {
      flex: 1,
      marginLeft: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    amountInput: {
      flex: 1,
      minHeight: 40,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.primary,
      backgroundColor: theme.inputBackground,
      fontSize: 14,
      color: theme.inputText,
    },
    amountSave: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 20,
      backgroundColor: theme.primary,
    },
    amountSaveText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textInverse,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 4,
    },
    actionButton: {
      flex: 1,
      minHeight: 48,
      paddingVertical: 13,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    actionDone: {
      backgroundColor: theme.success,
    },
    actionSkip: {
      backgroundColor: theme.warning,
    },
    actionText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textInverse,
    },
    notesLink: {
      alignSelf: 'center',
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    notesLinkText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
  });

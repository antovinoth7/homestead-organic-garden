import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      marginTop: 20,
      marginBottom: 8,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    hint: {
      fontSize: 11.5,
      lineHeight: 16,
      color: theme.textTertiary,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 8,
    },
    rowName: {
      flex: 1,
      fontSize: 14,
      color: theme.textSecondary,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: theme.primaryLight,
    },
    restoreText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.primary,
    },
  });

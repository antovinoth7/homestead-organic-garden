import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      marginTop: 4,
      marginBottom: 8,
      gap: 10,
    },
    resetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
    },
    resetText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    deleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.error,
      backgroundColor: theme.backgroundSecondary,
    },
    deleteText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.error,
    },
    safetyNote: {
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.textTertiary,
      textAlign: 'center',
      marginTop: -4,
      paddingHorizontal: 16,
    },
  });

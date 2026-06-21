import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.backgroundSecondary,
      marginTop: 1,
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 0.3,
    },
    healthRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    healthColumn: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    healthDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    healthCount: {
      fontSize: 22,
      fontWeight: 'bold',
      color: theme.text,
    },
    healthLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    healthDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
  });

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 18,
      marginBottom: 10,
    },
    title: {
      flexShrink: 1,
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 0.2,
    },
    action: {
      paddingLeft: 8,
      paddingVertical: 2,
    },
    actionText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
  });

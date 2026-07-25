import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    errorRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 5,
      marginTop: 5,
      marginLeft: 4,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: theme.error,
    },
  });

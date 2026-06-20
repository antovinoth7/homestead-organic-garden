import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.successLight,
      borderWidth: 1,
      borderColor: theme.success + '40',
    },
    icon: {
      fontSize: 20,
    },
    body: {
      flex: 1,
    },
    title: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    detail: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
  });

import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { font } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    count: {
      flex: 1,
      fontSize: 12,
      color: theme.textTertiary,
      ...font(theme, 'body'),
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    buttonText: {
      fontSize: 13,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    buttonTextSecondary: {
      color: theme.textSecondary,
    },
  });

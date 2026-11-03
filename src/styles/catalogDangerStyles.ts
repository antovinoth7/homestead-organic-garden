import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

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
      borderRadius: radius(theme, 'card', 12),
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      ...shadow(theme, 'card'),
    },
    resetText: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    deleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: radius(theme, 'card', 12),
      borderWidth: 1,
      borderColor: theme.error,
      backgroundColor: theme.backgroundSecondary,
      ...shadow(theme, 'card'),
    },
    deleteText: {
      fontSize: 14,
      color: theme.error,
      ...font(theme, 'bodyStrong', '600'),
    },
    safetyNote: {
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.textTertiary,
      textAlign: 'center',
      marginTop: -4,
      paddingHorizontal: 16,
      ...font(theme, 'body'),
    },
  });

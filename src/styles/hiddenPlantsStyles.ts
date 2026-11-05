import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

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
      minHeight: 44,
    },
    toggleLabel: {
      flex: 1,
      fontSize: 13,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    hint: {
      fontSize: 11.5,
      lineHeight: 16,
      color: theme.textTertiary,
      marginBottom: 8,
      ...font(theme, 'body'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: radius(theme, 'card', 10),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      marginBottom: 8,
      ...shadow(theme, 'card'),
    },
    rowName: {
      flex: 1,
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 14,
      minHeight: 44,
      borderRadius: radius(theme, 'button', 22),
      backgroundColor: theme.primaryLight,
    },
    restoreText: {
      fontSize: 12,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
  });

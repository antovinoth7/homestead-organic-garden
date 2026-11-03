import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    wrapper: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius(theme, 'chip', 20),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.border,
    },
    pillActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    pillText: {
      fontSize: 13,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    pillTextActive: {
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
  });

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      paddingHorizontal: 12,
    },
    optionGroup: {
      borderRadius: radius(theme, 'card', 14),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      overflow: 'hidden',
      ...shadow(theme, 'card'),
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    optionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    optionText: {
      fontSize: 16,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    cancelButton: {
      marginTop: 10,
      paddingVertical: 16,
      borderRadius: radius(theme, 'button', 14),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontSize: 16,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
  });

import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 8,
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 18,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    titleError: {
      color: theme.error,
    },
    errorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.error,
    },
    statusCompleteBadge: {
      width: 22,
      height: 22,
      borderRadius: radius(theme, 'chip', 11),
      backgroundColor: theme.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusOptionalBadge: {
      backgroundColor: theme.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius(theme, 'chip', 10),
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.borderLight,
    },
    statusOptionalText: {
      fontSize: 11,
      color: theme.textTertiary,
      ...font(theme, 'bodyStrong', '600'),
    },
    statusRequired: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.errorLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    statusRequiredDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.error,
    },
    statusRequiredText: {
      fontSize: 11,
      color: theme.error,
      ...font(theme, 'bodyBold', '700'),
    },
    /** Pushes the action slot to the trailing edge. */
    action: {
      marginLeft: 'auto',
    },
  });

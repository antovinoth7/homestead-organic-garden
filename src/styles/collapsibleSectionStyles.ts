import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: radius(theme, 'card', 12),
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      ...shadow(theme, 'card'),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.card,
    },
    headerMain: {
      flex: 1,
      minWidth: 0,
      marginRight: 8,
    },
    headerError: {
      backgroundColor: theme.errorLight,
      borderLeftWidth: 4,
      borderLeftColor: theme.error,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    headerIcon: {
      marginRight: 8,
    },
    /** Tinted circle behind the icon — opt-in via the `iconTint` prop. */
    headerIconCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
    },
    headerTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      minWidth: 0,
    },
    headerTitle: {
      fontSize: 16,
      color: theme.text,
      flexShrink: 1,
      ...font(theme, 'title', '600'),
    },
    headerSummary: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.textSecondary,
      marginTop: 4,
      ...font(theme, 'body'),
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginLeft: 8,
    },
    headerActionSlot: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronButton: {
      width: 32,
      height: 32,
      borderRadius: radius(theme, 'iconButton', 16),
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleError: {
      color: theme.error,
    },
    autoFilledBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: theme.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 10),
      marginLeft: 8,
    },
    autoFilledText: {
      fontSize: 11,
      color: theme.success,
      ...font(theme, 'bodyStrong', '600'),
    },
    errorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.error,
      marginLeft: 8,
    },
    content: {
      padding: 16,
      paddingTop: 0,
    },
    // --- #5 Section Status Indicators ---
    statusCompleteBadge: {
      width: 22,
      height: 22,
      borderRadius: radius(theme, 'chip', 11),
      backgroundColor: theme.success,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginLeft: 8,
    },
    statusRequired: {
      flexDirection: 'row' as const,
      alignItems: 'center',
      gap: 4,
      marginLeft: 8,
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
    statusOptionalBadge: {
      marginLeft: 8,
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
  });

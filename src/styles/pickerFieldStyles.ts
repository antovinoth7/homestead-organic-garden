import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    field: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.border,
      borderRadius: radius(theme, 'card', 12),
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...shadow(theme, 'card'),
    },
    fieldError: {
      borderColor: theme.error,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primaryLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    meta: { flex: 1 },
    label: {
      fontSize: 11,
      color: theme.textSecondary,
      letterSpacing: 0.3,
      ...font(theme, 'bodyStrong', '600'),
    },
    value: {
      fontSize: 15,
      color: theme.text,
      marginTop: 1,
      ...font(theme, 'bodyStrong', '600'),
    },
    placeholder: {
      fontSize: 15,
      color: theme.inputPlaceholder,
      marginTop: 1,
      ...font(theme, 'body'),
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
      ...font(theme, 'body'),
    },
    valueRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    badge: {
      backgroundColor: theme.primaryLight,
      borderRadius: radius(theme, 'chip', 8),
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 10,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
  });

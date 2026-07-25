import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      marginBottom: 12,
    },
    field: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    fieldError: {
      borderColor: theme.error,
    },
    emojiCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    emoji: {
      fontSize: 19,
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
      fontWeight: '600' as const,
      color: theme.textSecondary,
      letterSpacing: 0.3,
    },
    value: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: theme.text,
      marginTop: 1,
    },
    placeholder: {
      fontSize: 15,
      color: theme.inputPlaceholder,
      marginTop: 1,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    valueRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    badge: {
      backgroundColor: theme.primaryLight,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: theme.primary,
    },
  });

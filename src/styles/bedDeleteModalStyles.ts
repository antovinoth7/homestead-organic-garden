import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 32,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 20,
      padding: 28,
      alignItems: 'center' as const,
      width: '100%',
      maxWidth: 340,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.errorLight,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    title: {
      fontSize: 19,
      fontWeight: '700' as const,
      color: theme.text,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    message: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 21,
      marginBottom: 24,
    },
    buttonRow: {
      flexDirection: 'row' as const,
      gap: 12,
      width: '100%',
    },
    button: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
    },
    cancelButton: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: theme.text,
    },
    deleteButton: {
      backgroundColor: theme.error,
    },
    deleteButtonText: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: theme.textInverse,
    },
  });

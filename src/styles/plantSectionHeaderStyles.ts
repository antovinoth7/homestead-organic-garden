import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

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
      fontWeight: '700',
      color: theme.text,
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
      borderRadius: 11,
      backgroundColor: theme.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusOptionalBadge: {
      backgroundColor: theme.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    statusOptionalText: {
      fontSize: 11,
      color: theme.textTertiary,
      fontWeight: '600',
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
      fontWeight: '700',
    },
    /** Pushes the action slot to the trailing edge. */
    action: {
      marginLeft: 'auto',
    },
  });

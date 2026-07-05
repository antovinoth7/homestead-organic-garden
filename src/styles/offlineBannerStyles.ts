import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 16,
      backgroundColor: theme.warningLight,
      borderBottomWidth: 1,
      borderBottomColor: theme.warningBorder,
    },
    bannerSyncing: {
      backgroundColor: theme.successLight,
      borderBottomColor: theme.border,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.warningDark,
    },
    textSyncing: {
      color: theme.success,
    },
  });

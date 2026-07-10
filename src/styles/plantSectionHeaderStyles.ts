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
  });

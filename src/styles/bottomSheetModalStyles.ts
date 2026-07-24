import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Full-screen dim. The modal fades this in place — it must never be inside
    // a sliding window or the dim sweeps up as a curtain.
    root: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      width: '100%' as const,
    },
  });

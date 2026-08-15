import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    rowImage: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.backgroundSecondary,
    },
    rowFallback: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipImage: {
      width: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: theme.backgroundSecondary,
    },
    chipFallback: {
      width: 20,
      height: 20,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroImage: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundSecondary,
    },
    heroFallback: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundSecondary,
    },
  });

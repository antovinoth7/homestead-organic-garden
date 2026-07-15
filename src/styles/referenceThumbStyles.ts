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
    rowFallbackText: {
      fontSize: 24,
      textAlign: 'center',
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
    chipFallbackText: {
      fontSize: 13,
      textAlign: 'center',
    },
  });

import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * The toast sits on the hero green — dark in both themes — so its text and
 * check read from the hero tokens rather than `primaryDark`, which turns light
 * green in dark mode.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 18,
      right: 18,
      zIndex: 30,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: theme.heroGradientStart,
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 14,
        },
        android: { elevation: 8 },
      }),
    },
    text: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      color: theme.heroText,
    },
  });

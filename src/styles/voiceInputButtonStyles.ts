import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { radius } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    button: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonCircle: {
      width: 32,
      height: 32,
      borderRadius: radius(theme, 'iconButton', 16),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    buttonListening: {
      backgroundColor: theme.error,
      borderColor: theme.error,
    },
    buttonDisabled: {
      backgroundColor: theme.backgroundSecondary,
      borderColor: theme.border,
    },
  });

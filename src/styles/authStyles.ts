import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      fontSize: 32,
      color: theme.text,
      marginTop: 16,
      ...font(theme, 'title', 'bold'),
    },
    subtitle: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 8,
      ...font(theme, 'body'),
    },
    form: {
      width: '100%',
    },
    button: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: radius(theme, 'button', 12),
      alignItems: 'center',
      marginTop: 8,
      ...shadow(theme, 'button'),
    },
    buttonDisabled: {
      backgroundColor: theme.textTertiary,
    },
    buttonText: {
      color: theme.textInverse,
      fontSize: 18,
      ...font(theme, 'bodyStrong', '600'),
    },
    switchButton: {
      marginTop: 24,
      alignItems: 'center',
    },
    switchText: {
      color: theme.primary,
      fontSize: 16,
      ...font(theme, 'bodyMedium', '500'),
    },
  });

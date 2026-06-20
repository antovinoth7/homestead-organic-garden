import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    icon: {
      fontSize: 26,
    },
    body: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    highlight: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 1,
    },
    note: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
      marginTop: 8,
    },
    link: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      marginTop: 10,
    },
    linkText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
  });

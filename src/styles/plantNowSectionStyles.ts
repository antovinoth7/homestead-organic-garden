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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    title: {
      flexShrink: 1,
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    link: {
      paddingVertical: 2,
      paddingLeft: 8,
    },
    linkText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
    summary: {
      marginTop: 4,
      fontSize: 12,
      lineHeight: 17,
      color: theme.accent,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.successLight,
      borderWidth: 1,
      borderColor: theme.success + '40',
    },
    chipText: {
      fontSize: 12,
      color: theme.text,
      fontWeight: '600',
    },
  });

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 12,
      backgroundColor: theme.primary,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      color: theme.textInverse,
      textAlign: 'center',
    },
    headerSpacer: {
      width: 40,
    },
    listContent: {
      padding: 16,
      gap: 10,
    },
    monthCard: {
      flexDirection: 'row',
      gap: 12,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    monthCardCurrent: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    monthIcon: {
      fontSize: 26,
    },
    monthBody: {
      flex: 1,
    },
    monthLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    monthHighlight: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 2,
    },
    monthNote: {
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
      marginTop: 4,
    },
  });

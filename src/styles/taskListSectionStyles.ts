import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.backgroundSecondary,
      marginTop: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 0.3,
    },
    seeAll: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
    },
    rowTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    rowSub: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    overdueBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      backgroundColor: theme.errorLight,
    },
    overdueBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.error,
    },
    timeText: {
      fontSize: 11,
      color: theme.textSecondary,
    },
  });

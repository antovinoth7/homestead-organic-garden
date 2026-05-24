import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    svgContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
    },
    legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 12,
      paddingBottom: 10,
      gap: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendText: {
      fontSize: 11,
      color: theme.textSecondary,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 13,
      color: theme.textTertiary,
      marginTop: 8,
      textAlign: 'center',
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 12,
      marginBottom: 10,
      borderRadius: 6,
      backgroundColor: theme.primaryLight,
    },
    resetText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: '600',
    },
    compassBadge: {
      position: 'absolute',
      top: 8,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    compassText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.primary,
    },
  });

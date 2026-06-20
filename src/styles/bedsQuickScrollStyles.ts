import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    section: {
      backgroundColor: theme.backgroundSecondary,
      paddingTop: 12,
      paddingBottom: 14,
      paddingLeft: 16,
      marginTop: 1,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: 0.3,
      marginBottom: 10,
    },
    listContent: {
      paddingRight: 8,
      gap: 10,
    },
    card: {
      width: 132,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    typeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    typeBadgeText: {
      fontSize: 16,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    bedName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 6,
    },
    statusChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      marginBottom: 6,
    },
    statusChipText: {
      fontSize: 11,
      fontWeight: '600',
    },
    plantCount: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    ghostCard: {
      width: 132,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.primary + '80',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    ghostText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
  });

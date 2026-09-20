import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    block: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      borderRadius: 10,
      marginBottom: 8,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: theme.backgroundSecondary,
    },
    accentDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    accentHigh: {
      backgroundColor: theme.error,
    },
    accentMedium: {
      backgroundColor: theme.warning,
    },
    accentLow: {
      backgroundColor: theme.success,
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    summary: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    content: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.borderLight,
    },
    // ExpandableText
    readMore: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 4,
    },
    measureHidden: {
      position: 'absolute',
      left: 0,
      right: 0,
      opacity: 0,
      zIndex: -1,
    },
  });

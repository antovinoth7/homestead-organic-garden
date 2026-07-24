import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      // maxHeight is computed at runtime (window height minus the top inset).
      paddingBottom: 24,
    },
    sheetTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme.text,
      textAlign: 'center' as const,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    scrollContent: {
      paddingHorizontal: 14,
      paddingBottom: 16,
    },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: theme.textTertiary,
      letterSpacing: 0.8,
      paddingTop: 14,
      paddingBottom: 8,
      textTransform: 'uppercase' as const,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      gap: 12,
    },
    rowSelected: {
      backgroundColor: theme.primaryLight,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primaryLight,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    emojiCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.backgroundTertiary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    emoji: {
      fontSize: 18,
    },
    rowMeta: { flex: 1 },
    rowNameLine: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    rowName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: theme.text,
    },
    rowDescription: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
      lineHeight: 16,
    },
    currentBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
      marginLeft: 6,
    },
    currentBadgeText: {
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: '600' as const,
    },
  });

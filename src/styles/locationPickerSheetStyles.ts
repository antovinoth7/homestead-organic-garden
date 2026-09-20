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
    stageLabel: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: theme.textTertiary,
      letterSpacing: 0.8,
      paddingTop: 14,
      paddingBottom: 8,
      textTransform: 'uppercase' as const,
    },
    cardGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 10,
    },
    locationCard: {
      flexBasis: '47%' as const,
      flexGrow: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      padding: 12,
      alignItems: 'center' as const,
      gap: 6,
    },
    locationCardSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    locationCardName: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.text,
      textAlign: 'center' as const,
    },
    locationCardNameSelected: {
      color: theme.primary,
    },
    shortNameBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
    },
    shortNameBadgeText: {
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: '600' as const,
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    chipText: {
      fontSize: 13,
      color: theme.text,
    },
    chipTextSelected: {
      color: theme.primary,
      fontWeight: '600' as const,
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 32,
    },
    emptyStateText: {
      fontSize: 13,
      color: theme.textTertiary,
      marginTop: 8,
      textAlign: 'center' as const,
      paddingHorizontal: 24,
    },
  });

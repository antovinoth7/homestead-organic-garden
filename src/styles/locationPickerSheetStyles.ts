import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
      // maxHeight is computed at runtime (window height minus the top inset).
      paddingBottom: 24,
    },
    sheetTitle: {
      fontSize: 16,
      color: theme.text,
      textAlign: 'center' as const,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      ...font(theme, 'title', '700'),
    },
    scrollContent: {
      paddingHorizontal: 14,
      paddingBottom: 16,
    },
    stageLabel: {
      color: theme.textTertiary,
      paddingTop: 14,
      paddingBottom: 8,
      textTransform: 'uppercase' as const,
      ...eyebrow(theme, { fontSize: 10, letterSpacing: 0.8, fontWeight: '700' }),
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
      borderRadius: radius(theme, 'card', 12),
      borderWidth: border(theme, 'card', 1.5),
      borderColor: theme.border,
      padding: 12,
      alignItems: 'center' as const,
      gap: 6,
      ...shadow(theme, 'card'),
    },
    locationCardSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    locationCardName: {
      fontSize: 13,
      color: theme.text,
      textAlign: 'center' as const,
      ...font(theme, 'bodyStrong', '600'),
    },
    locationCardNameSelected: {
      color: theme.primary,
    },
    shortNameBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 8),
      backgroundColor: theme.backgroundTertiary,
    },
    shortNameBadgeText: {
      fontSize: 10,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    chipRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius(theme, 'chip', 16),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.border,
    },
    chipSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    chipText: {
      fontSize: 13,
      color: theme.text,
      ...font(theme, 'body'),
    },
    chipTextSelected: {
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
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
      ...font(theme, 'body'),
    },
  });

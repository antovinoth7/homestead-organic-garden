import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { eyebrow, font, radius } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
      // height is computed at runtime (85% of the window, capped below the top inset).
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
    searchBarContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginHorizontal: 12,
      marginTop: 10,
      marginBottom: 4,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      gap: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      paddingVertical: 9,
      ...font(theme, 'body'),
    },
    listContent: {
      paddingBottom: 16,
    },
    categoryHeader: {
      color: theme.textTertiary,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 4,
      textTransform: 'uppercase' as const,
      ...eyebrow(theme, { fontSize: 10, letterSpacing: 0.8, fontWeight: '700' }),
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      gap: 12,
    },
    rowSelected: {
      backgroundColor: theme.primaryLight,
    },
    rowMeta: { flex: 1 },
    rowName: {
      fontSize: 15,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    badgeRow: {
      flexDirection: 'row' as const,
      gap: 6,
      marginTop: 4,
      flexWrap: 'wrap' as const,
    },
    categoryBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 8),
      backgroundColor: theme.backgroundTertiary,
    },
    categoryBadgeText: {
      fontSize: 10,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    seasonBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 8),
      backgroundColor: theme.primaryLight,
    },
    seasonBadgeText: {
      fontSize: 10,
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

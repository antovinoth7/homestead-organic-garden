import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { eyebrow, font, radius } from '@/theme/styleTokens';

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
    sectionLabel: {
      color: theme.textTertiary,
      paddingTop: 14,
      paddingBottom: 8,
      textTransform: 'uppercase' as const,
      ...eyebrow(theme, { fontSize: 10, letterSpacing: 0.8, fontWeight: '700' }),
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
    rowMeta: { flex: 1 },
    rowNameLine: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    rowName: {
      fontSize: 15,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    rowDescription: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
      lineHeight: 16,
      ...font(theme, 'body'),
    },
    currentBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 8),
      backgroundColor: theme.backgroundTertiary,
      marginLeft: 6,
    },
    currentBadgeText: {
      fontSize: 10,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
  });

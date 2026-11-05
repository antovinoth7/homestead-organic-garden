import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
      // maxHeight is computed at runtime (window height minus the top inset).
    },
    title: {
      fontSize: 16,
      color: theme.text,
      textAlign: 'center' as const,
      paddingVertical: 10,
      ...font(theme, 'title', '700'),
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center' as const,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      ...font(theme, 'body'),
    },
    tabBar: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center' as const,
    },
    tabActive: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primary,
    },
    tabText: {
      fontSize: 13,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    tabTextActive: {
      color: theme.primary,
    },
    // flexShrink lets the list shrink within the sheet's maxHeight so it scrolls
    // internally and the footer buttons stay pinned/visible (not pushed off-screen).
    scrollArea: { flexShrink: 1 },
    scroll: { paddingVertical: 12, paddingHorizontal: 14 },
    sectionLabel: {
      fontSize: 10,
      color: theme.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 8,
      ...font(theme, 'bodyBold', '700'),
    },
    varietyGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    varietyChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius(theme, 'chip', 16),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'chip', 1.5),
      borderColor: theme.border,
    },
    varietyChipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    varietyChipText: {
      fontSize: 13,
      color: theme.text,
      ...font(theme, 'bodyMedium', '500'),
    },
    varietyChipTextActive: {
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    plantRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 8,
      borderRadius: radius(theme, 'card', 10),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'card', 1.5),
      borderColor: theme.border,
      gap: 10,
      ...shadow(theme, 'card'),
    },
    plantRowSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    plantInfo: { flex: 1 },
    plantName: {
      fontSize: 14,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    plantSub: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 24,
      gap: 8,
    },
    emptyStateText: {
      fontSize: 13,
      color: theme.textTertiary,
      textAlign: 'center' as const,
      paddingHorizontal: 20,
      lineHeight: 18,
      ...font(theme, 'body'),
    },
    footer: {
      flexDirection: 'row' as const,
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    secondaryBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius(theme, 'button', 10),
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center' as const,
      backgroundColor: theme.background,
    },
    secondaryBtnText: {
      fontSize: 14,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    primaryBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius(theme, 'button', 10),
      alignItems: 'center' as const,
      backgroundColor: theme.primary,
      ...shadow(theme, 'button'),
    },
    primaryBtnDisabled: {
      backgroundColor: theme.textTertiary,
    },
    primaryBtnText: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
    revertBtn: {
      marginTop: 12,
      paddingVertical: 10,
      alignItems: 'center' as const,
    },
    loader: {
      marginVertical: 24,
    },
    revertBtnText: {
      fontSize: 13,
      color: theme.warning,
      ...font(theme, 'bodyStrong', '600'),
    },
  });

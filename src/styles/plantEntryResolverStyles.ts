import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%' as const,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: 'center' as const,
      marginTop: 10,
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme.text,
      textAlign: 'center' as const,
      paddingVertical: 10,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center' as const,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
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
      fontWeight: '600' as const,
      color: theme.textSecondary,
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
      fontWeight: '700' as const,
      color: theme.textTertiary,
      letterSpacing: 0.8,
      marginBottom: 8,
    },
    varietyGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    varietyChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    varietyChipActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    varietyChipText: {
      fontSize: 13,
      color: theme.text,
      fontWeight: '500' as const,
    },
    varietyChipTextActive: {
      color: theme.primary,
      fontWeight: '700' as const,
    },
    plantRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 8,
      borderRadius: 10,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: theme.border,
      gap: 10,
    },
    plantRowSelected: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    plantInfo: { flex: 1 },
    plantName: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.text,
    },
    plantSub: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
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
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center' as const,
      backgroundColor: theme.background,
    },
    secondaryBtnText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: theme.text,
    },
    primaryBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center' as const,
      backgroundColor: theme.primary,
    },
    primaryBtnDisabled: {
      backgroundColor: theme.textTertiary,
    },
    primaryBtnText: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: theme.textInverse,
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
      fontWeight: '600' as const,
    },
  });

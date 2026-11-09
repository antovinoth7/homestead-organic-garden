import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, font, radius, shadow } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 10,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: { fontSize: 18, color: theme.text, ...font(theme, 'title', '700') },
    list: { padding: 12, paddingBottom: 100 },
    plantRow: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: radius(theme, 'card', 10),
      padding: 12,
      marginBottom: 8,
      borderWidth: border(theme, 'card', 1.5),
      borderColor: theme.border,
      ...shadow(theme, 'card'),
    },
    plantRowSelected: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    plantRowInfo: {},
    plantName: { fontSize: 15, color: theme.text, ...font(theme, 'bodyStrong', '600') },
    plantVariety: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
      ...font(theme, 'body'),
    },
    assignedBadge: {
      fontSize: 11,
      color: theme.warning,
      marginTop: 3,
      ...font(theme, 'body'),
    },
    layerPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    layerChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius(theme, 'chip', 14),
      backgroundColor: theme.border,
    },
    layerChipActive: { backgroundColor: theme.primaryLight },
    layerChipText: { fontSize: 11, color: theme.text, ...font(theme, 'body') },
    layerChipTextActive: { color: theme.primary, ...font(theme, 'bodyStrong', '600') },
    confirmButton: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      backgroundColor: theme.primary,
      borderRadius: radius(theme, 'button', 12),
      padding: 16,
      alignItems: 'center',
      ...shadow(theme, 'button'),
    },
    confirmButtonDisabled: { backgroundColor: theme.textTertiary },
    confirmText: { color: theme.textInverse, fontSize: 16, ...font(theme, 'bodyBold', '700') },

    // ── Bottom sheet ─────────────────────────────────────────────────────────
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
      // maxHeight and paddingBottom are computed at runtime from the safe-area insets.
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

    // ── Tab bar ──────────────────────────────────────────────────────────────
    tabBar: {
      flexDirection: 'row' as const,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
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

    // ── Guild tab rows ────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize: 10,
      color: theme.textTertiary,
      letterSpacing: 0.8,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 4,
      ...font(theme, 'bodyBold', '700'),
    },
    guildPlantRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
      gap: 10,
    },
    guildMeta: { flex: 1 },
    guildName: { fontSize: 14, color: theme.text, ...font(theme, 'bodyStrong', '600') },
    guildBadgeRow: {
      flexDirection: 'row' as const,
      gap: 6,
      marginTop: 3,
      flexWrap: 'wrap' as const,
    },
    guildLayerBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius(theme, 'chip', 8),
      backgroundColor: theme.backgroundTertiary,
    },
    guildLayerBadgeText: {
      fontSize: 10,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    guildAddBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: radius(theme, 'button', 14),
      backgroundColor: theme.primary,
      ...shadow(theme, 'button'),
    },
    guildAddBtnText: {
      fontSize: 12,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },

    // ── My Plants tab ─────────────────────────────────────────────────────────
    myPlantRow: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: radius(theme, 'card', 10),
      padding: 12,
      marginHorizontal: 12,
      marginBottom: 8,
      borderWidth: border(theme, 'card', 1.5),
      borderColor: theme.border,
      ...shadow(theme, 'card'),
    },
    myPlantRowSelected: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    myPlantName: { fontSize: 15, color: theme.text, ...font(theme, 'bodyStrong', '600') },
    myPlantVariety: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
      ...font(theme, 'body'),
    },
    addSelectedBtn: {
      marginHorizontal: 14,
      marginTop: 10,
      marginBottom: 4,
      backgroundColor: theme.primary,
      borderRadius: radius(theme, 'button', 12),
      padding: 14,
      alignItems: 'center' as const,
      ...shadow(theme, 'button'),
    },
    addSelectedBtnDisabled: { backgroundColor: theme.textTertiary },
    addSelectedText: { color: theme.textInverse, fontSize: 15, ...font(theme, 'bodyBold', '700') },

    // ── Info note ─────────────────────────────────────────────────────────────
    infoNote: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      marginHorizontal: 14,
      marginTop: 10,
      marginBottom: 4,
      padding: 10,
      borderRadius: 10,
      backgroundColor: theme.backgroundTertiary,
    },
    infoNoteText: {
      flex: 1,
      fontSize: 12,
      color: theme.textSecondary,
      lineHeight: 17,
      ...font(theme, 'body'),
    },

    // ── Empty state ───────────────────────────────────────────────────────────
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 32,
    },
    emptyStateText: {
      fontSize: 13,
      color: theme.textTertiary,
      marginTop: 8,
      textAlign: 'center' as const,
      ...font(theme, 'body'),
    },
    myPlantsListContent: { padding: 12, paddingBottom: 4 },

    // ── Search bar ────────────────────────────────────────────────────────────
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

    // ── Spacing info tags ─────────────────────────────────────────────────────
    spacingTag: {
      fontSize: 10,
      color: theme.textTertiary,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: radius(theme, 'chip', 4),
      paddingHorizontal: 5,
      paddingVertical: 2,
      ...font(theme, 'bodyStrong', '600'),
    },
    spacingTagRow: {
      flexDirection: 'row' as const,
      gap: 6,
      marginTop: 3,
    },
    nameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
  });

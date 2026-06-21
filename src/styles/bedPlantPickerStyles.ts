import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

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
    title: { fontSize: 18, fontWeight: '700', color: theme.text },
    list: { padding: 12, paddingBottom: 100 },
    plantRow: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    plantRowSelected: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    plantRowInfo: {},
    plantName: { fontSize: 15, fontWeight: '600', color: theme.text },
    plantVariety: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
    assignedBadge: {
      fontSize: 11,
      color: theme.warning,
      marginTop: 3,
    },
    layerPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    layerChip: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: theme.border,
    },
    layerChipActive: { backgroundColor: theme.primaryLight },
    layerChipText: { fontSize: 11, color: theme.text },
    layerChipTextActive: { color: theme.primary, fontWeight: '600' },
    confirmButton: {
      position: 'absolute',
      bottom: 24,
      left: 16,
      right: 16,
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    confirmButtonDisabled: { backgroundColor: theme.textTertiary },
    confirmText: { color: theme.textInverse, fontWeight: '700', fontSize: 16 },
    loader: { flex: 1 },

    // ── Bottom sheet ─────────────────────────────────────────────────────────
    sheetOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '85%' as const,
      paddingBottom: 24,
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
    sheetTitle: {
      fontSize: 16,
      fontWeight: '700' as const,
      color: theme.text,
      textAlign: 'center' as const,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
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
      fontWeight: '600' as const,
      color: theme.textSecondary,
    },
    tabTextActive: {
      color: theme.primary,
    },

    // ── Guild tab rows ────────────────────────────────────────────────────────
    sectionLabel: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: theme.textTertiary,
      letterSpacing: 0.8,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 4,
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
    guildEmoji: { fontSize: 22, width: 30, textAlign: 'center' as const },
    guildMeta: { flex: 1 },
    guildName: { fontSize: 14, fontWeight: '600' as const, color: theme.text },
    guildBadgeRow: {
      flexDirection: 'row' as const,
      gap: 6,
      marginTop: 3,
      flexWrap: 'wrap' as const,
    },
    guildLayerBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: theme.backgroundTertiary,
    },
    guildLayerBadgeText: { fontSize: 10, color: theme.textSecondary, fontWeight: '600' as const },
    guildSpacingTag: { fontSize: 11, color: theme.textTertiary },
    guildAddBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: theme.primary,
    },
    guildAddBtnText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: theme.textInverse,
    },

    // ── My Plants tab ─────────────────────────────────────────────────────────
    myPlantRow: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 12,
      marginHorizontal: 12,
      marginBottom: 8,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    myPlantRowSelected: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    myPlantName: { fontSize: 15, fontWeight: '600' as const, color: theme.text },
    myPlantVariety: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
    addSelectedBtn: {
      marginHorizontal: 14,
      marginTop: 10,
      marginBottom: 4,
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center' as const,
    },
    addSelectedBtnDisabled: { backgroundColor: theme.textTertiary },
    addSelectedText: { color: theme.textInverse, fontWeight: '700' as const, fontSize: 15 },

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
    },
    myPlantsListContent: { padding: 12, paddingBottom: 4 },
    removeXText: { fontSize: 10, fontWeight: '800' as const, color: theme.textInverse },

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
    },

    // ── Spacing info tags ─────────────────────────────────────────────────────
    spacingTag: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: theme.textTertiary,
      backgroundColor: theme.backgroundTertiary,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
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

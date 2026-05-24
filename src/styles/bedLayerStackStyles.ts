import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: { gap: 10 },

    // ── Compass markers ──────────────────────────────────────────────────────
    compass: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 6,
      gap: 6,
    },
    compassText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: theme.textSecondary,
      letterSpacing: 0.6,
    },
    compassSub: {
      fontSize: 10,
      color: theme.textTertiary,
      marginLeft: 6,
    },

    // ── Capacity strip ───────────────────────────────────────────────────────
    capacityStrip: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
      paddingHorizontal: 4,
      paddingBottom: 2,
    },
    capacityChip: {
      fontSize: 11,
      color: theme.textSecondary,
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    capacityOverflow: {
      color: theme.error,
      backgroundColor: theme.errorLight ?? theme.backgroundTertiary,
      fontWeight: '700' as const,
    },

    // ── Layer section card ───────────────────────────────────────────────────
    layerCard: {
      borderRadius: 14,
      borderWidth: 1.5,
      overflow: 'hidden' as const,
    },
    layerAccent: {
      height: 4,
      width: '100%' as const,
    },
    layerHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 6,
      gap: 8,
    },
    layerIcon: { fontSize: 22 },
    layerTitleCol: { flex: 1 },
    layerTitle: {
      fontSize: 14,
      fontWeight: '700' as const,
      color: theme.text,
    },
    layerSubtitle: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 1,
    },
    layerCount: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: theme.textSecondary,
      backgroundColor: theme.backgroundTertiary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    addBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: theme.primary,
    },
    addBtnText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: theme.textInverse,
    },

    // ── Plant tiles scroller ─────────────────────────────────────────────────
    tilesRow: {
      flexDirection: 'row' as const,
      paddingHorizontal: 10,
      paddingBottom: 10,
      paddingTop: 4,
      gap: 8,
    },
    tile: {
      minWidth: 90,
      maxWidth: 130,
      borderRadius: 10,
      borderWidth: 1.5,
      backgroundColor: theme.background,
      padding: 8,
      gap: 4,
      alignItems: 'center' as const,
    },
    tileCompanion: {
      borderStyle: 'dashed' as const,
    },
    tileDragging: {
      borderWidth: 2,
    },
    tileEmoji: { fontSize: 22 },
    tileName: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: theme.text,
      textAlign: 'center' as const,
    },
    tileSpacing: {
      fontSize: 10,
      color: theme.textTertiary,
    },
    tileRemove: {
      position: 'absolute' as const,
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.error,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    tileRemoveText: {
      fontSize: 11,
      fontWeight: '800' as const,
      color: theme.textInverse,
      lineHeight: 13,
    },

    // ── Resolution chip on each tile ─────────────────────────────────────────
    resolutionChip: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      borderStyle: 'dashed' as const,
      borderColor: theme.textTertiary,
      marginTop: 2,
    },
    resolutionChipText: {
      fontSize: 9,
      color: theme.textSecondary,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
    },
    resolutionChipResolved: {
      borderStyle: 'solid' as const,
      borderColor: theme.success,
      backgroundColor: theme.successLight ?? theme.primaryLight,
    },
    resolutionChipResolvedText: {
      color: theme.success,
    },

    // ── Ghost section (empty layer) ──────────────────────────────────────────
    ghostCard: {
      borderRadius: 14,
      borderWidth: 1.5,
      borderStyle: 'dashed' as const,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      padding: 14,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
    },
    ghostIcon: { fontSize: 22, opacity: 0.5 },
    ghostInfo: { flex: 1 },
    ghostTitle: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: theme.textSecondary,
    },
    ghostSubtitle: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 1,
    },
    ghostAddBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    ghostAddBtnText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: theme.primary,
    },
  });

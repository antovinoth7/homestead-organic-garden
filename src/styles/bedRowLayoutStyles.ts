import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

// Companion tile fixed design — matches LAYER_BORDER['climber'] purple
const COMPANION_BORDER = '#7b1fa2';
const COMPANION_BG = '#f5f0fa';
// Ground cover legend swatch — matches LAYER_BORDER['ground_cover'] amber
const GROUND_BORDER = '#c8842a';
// Main crop legend swatch — matches LAYER_BORDER['understory'] green
const MAIN_BORDER = '#558b2f';
// Harvest badge — amber/orange
const HARVEST_BG = '#fff3e0';
const HARVEST_TEXT = '#e65100';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    emptyText: {
      fontSize: 13,
      color: theme.textTertiary,
      textAlign: 'center',
      marginTop: 10,
    },

    // ── Compass bars ──────────────────────────────────────────────────────────
    compassHeader: {
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    compassHeaderLeft: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textInverse,
      letterSpacing: 0.3,
      flexShrink: 1,
    },
    compassHeaderRight: {
      fontSize: 11,
      color: theme.textInverse,
      fontWeight: '600',
      opacity: 0.85,
      marginLeft: 8,
    },
    compassFooter: {
      backgroundColor: theme.backgroundSecondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      marginTop: 4,
    },
    compassFooterLeft: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    compassFooterRight: {
      fontSize: 10,
      color: theme.textTertiary,
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    // ── Capacity strip ────────────────────────────────────────────────────────
    capacityStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderWidth: 1,
      marginBottom: 8,
    },
    capacityStripOk: {
      backgroundColor: theme.successLight,
      borderColor: theme.success,
    },
    capacityStripOver: {
      backgroundColor: theme.errorLight,
      borderColor: theme.error,
    },
    capacityStripText: {
      fontSize: 12,
      fontWeight: '700',
    },
    capacityStripTextOk: {
      color: theme.success,
    },
    capacityStripTextOver: {
      color: theme.error,
    },

    // ── Row card ──────────────────────────────────────────────────────────────
    rowCard: {
      borderRadius: 10,
      marginBottom: 6,
      borderWidth: 1.5,
      overflow: 'hidden',
    },
    rowAccentStripe: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
    },
    rowHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 14,
      paddingRight: 12,
      paddingTop: 10,
      paddingBottom: 8,
      gap: 6,
      borderBottomWidth: 1,
    },
    rowNumCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowNumText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textInverse,
    },
    rowIcon: {
      fontSize: 16,
    },
    rowNameText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: theme.text,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
    },
    nFixerBadge: {
      backgroundColor: theme.successLight,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    nFixerBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: theme.successDark,
    },
    fillsGapsBadge: {
      backgroundColor: HARVEST_BG,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    fillsGapsBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: HARVEST_TEXT,
    },
    staggeredBadge: {
      backgroundColor: theme.accentLight,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    staggeredBadgeText: {
      fontSize: 9,
      color: theme.accent,
      fontWeight: '700',
    },
    mainCropBadge: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mainCropBadgeText: {
      fontSize: 9,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    plantCountText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
    },

    // ── Plant tiles ───────────────────────────────────────────────────────────
    plantTilesContainer: {
      flexDirection: 'row',
      paddingLeft: 14,
      paddingTop: 10,
      paddingBottom: 10,
      paddingRight: 8,
      gap: 8,
    },
    plantTileMain: {
      width: 80,
      minHeight: 90,
      borderRadius: 8,
      borderWidth: 1.5,
      padding: 6,
      alignItems: 'center',
      gap: 3,
    },
    plantTileCompanion: {
      width: 80,
      minHeight: 90,
      borderRadius: 8,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: COMPANION_BORDER,
      backgroundColor: COMPANION_BG,
      padding: 6,
      alignItems: 'center',
      gap: 3,
    },
    plantTileEmpty: {
      width: 80,
      minHeight: 90,
      borderRadius: 8,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      padding: 6,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      opacity: 0.3,
    },
    plantTileEmoji: {
      fontSize: 22,
    },
    plantTileName: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      lineHeight: 13,
    },
    plantTileEmptyIcon: {
      fontSize: 20,
      color: theme.textTertiary,
    },
    tileGapDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.textTertiary,
      alignSelf: 'center' as const,
      opacity: 0.5,
    },

    // Harvest & benefit badges inside tile
    harvestBadge: {
      backgroundColor: HARVEST_BG,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginTop: 2,
    },
    harvestBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: HARVEST_TEXT,
    },
    benefitBadge: {
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginTop: 2,
    },
    benefitBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: theme.textInverse,
    },
    companionFixedBadge: {
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginTop: 2,
      borderWidth: 1,
      borderColor: COMPANION_BORDER,
      backgroundColor: COMPANION_BG,
    },
    companionFixedBadgeText: {
      fontSize: 8,
      fontWeight: '700',
      color: COMPANION_BORDER,
    },
    spacingBadge: {
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      marginTop: 2,
      backgroundColor: theme.backgroundSecondary,
    },
    spacingBadgeText: {
      fontSize: 8,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    emptySlotSpacingText: {
      fontSize: 9,
      color: theme.textTertiary,
      fontWeight: '600',
    },

    // ── Care task chips ────────────────────────────────────────────────────────
    careTaskChips: {
      flexDirection: 'row',
      paddingLeft: 14,
      paddingBottom: 10,
      paddingTop: 4,
      paddingRight: 8,
      gap: 6,
    },
    careTaskChip: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    careTaskChipText: {
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: '600',
    },

    // ── Planting schedule ─────────────────────────────────────────────────────
    scheduleSection: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 14,
      marginTop: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    scheduleSectionTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textTertiary,
      letterSpacing: 1,
      marginBottom: 10,
    },
    scheduleWeekRow: {
      marginBottom: 10,
    },
    scheduleWeekLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 6,
    },
    scheduleTagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    scheduleTag: {
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    scheduleTagNow: {
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    scheduleTagLater: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    scheduleTagText: {
      fontSize: 11,
      fontWeight: '600',
    },
    scheduleTagTextNow: {
      color: theme.primary,
    },
    scheduleTagTextLater: {
      color: theme.textSecondary,
    },

    // ── Rules panel ────────────────────────────────────────────────────────────
    rulesPanel: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 14,
      marginTop: 4,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rulesPanelTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textTertiary,
      letterSpacing: 1,
      marginBottom: 10,
    },
    ruleItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginBottom: 6,
    },
    ruleText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 17,
    },
    ruleTextOk: {
      color: theme.text,
    },
    ruleTextWarn: {
      color: theme.error,
      fontWeight: '600',
    },

    // ── Legend ─────────────────────────────────────────────────────────────────
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
      marginBottom: 4,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendSwatchMain: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: MAIN_BORDER,
    },
    legendSwatchCompanion: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: COMPANION_BORDER,
      backgroundColor: COMPANION_BG,
    },
    legendSwatchGround: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: GROUND_BORDER,
    },
    legendText: {
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: '600',
    },

    // ── Ghost rows (unoccupied layers) ─────────────────────────────────────────
    plantTileEmptyTappable: {
      opacity: 1,
    },
    ghostRowsLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textTertiary,
      letterSpacing: 0.8,
      paddingHorizontal: 4,
      paddingTop: 10,
      paddingBottom: 4,
    },

    // ── RowCard accordion ──────────────────────────────────────────────────────
    rowHeaderCollapsed: {
      borderBottomWidth: 0,
    },
    rowChevron: {
      marginLeft: 'auto' as const,
    },
    collapsedSummary: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      paddingLeft: 14,
      paddingRight: 12,
      paddingBottom: 10,
      paddingTop: 4,
      gap: 6,
    },
    collapsedChip: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    collapsedChipText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: theme.textSecondary,
    },
    collapsedMore: {
      fontSize: 10,
      color: theme.textTertiary,
      fontWeight: '600' as const,
    },

    // ── AvailableLayersSection ─────────────────────────────────────────────────
    availableLayersCard: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      marginBottom: 6,
      overflow: 'hidden' as const,
    },
    availableLayersHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    availableLayersTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700' as const,
      color: theme.text,
    },
    availableLayersBadge: {
      backgroundColor: theme.primaryLight,
      borderRadius: 10,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    availableLayersBadgeText: {
      fontSize: 11,
      fontWeight: '700' as const,
      color: theme.primary,
    },
    availableLayersList: {
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    availableLayerItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    availableLayerItemIcon: {
      fontSize: 18,
    },
    availableLayerItemName: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: theme.text,
    },
    availableLayerItemTextBlock: {
      flex: 1,
    },
    availableLayerItemMeta: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 1,
    },
    availableLayerItemDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    // ── BedInsightsAccordion ───────────────────────────────────────────────────
    insightsCard: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSecondary,
      marginTop: 8,
      marginBottom: 6,
      overflow: 'hidden' as const,
    },
    insightsHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    insightsTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700' as const,
      color: theme.text,
    },
    insightsSummary: {
      fontSize: 11,
      color: theme.textSecondary,
      marginRight: 4,
    },
    insightsSummaryWarn: {
      color: theme.error,
      fontWeight: '600' as const,
    },
  });

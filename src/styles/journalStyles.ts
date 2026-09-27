import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
    },
    header: {
      backgroundColor: theme.tabBarBackground,
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.text,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchActiveDot: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.accent,
    },
    searchExpandedRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchBackBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchExpandedWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 8,
    },
    searchExpandedInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      padding: 0,
    },
    filterToggleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
    },
    filterToggleButtonActive: {
      backgroundColor: theme.accent,
    },
    filterBadge: {
      position: 'absolute',
      top: 1,
      right: 1,
      minWidth: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    filterBadgeText: {
      fontSize: 9,
      color: theme.buttonText,
      fontWeight: '700',
      lineHeight: 14,
    },
    statsHeader: {
      marginTop: 4,
      marginBottom: 10,
    },
    // "All time ▾" above the stat strip — says which window the figures cover.
    periodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      paddingVertical: 4,
      marginBottom: 6,
    },
    periodText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    sheetChipLabel: {
      flexShrink: 1,
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
      zIndex: 1000,
      elevation: 1000,
    },
    sheetContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    sheetClearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: theme.errorLight,
    },
    sheetClearText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.error,
    },
    sheetScroll: {
      paddingHorizontal: 20,
    },
    sheetScrollContent: {
      paddingBottom: 20,
    },
    sheetSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 8,
    },
    sheetChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    sheetChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sheetChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    sheetChipText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    sheetChipTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      gap: 12,
    },
    // Swipeable clips its children (overflow: hidden), so the rounding lives on
    // its container — the revealed Edit/Delete actions pick up the same corners.
    swipeContainer: {
      borderRadius: 16,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    typeChipText: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    // Per-type tint for the type chip, keyed `typeChip_<JournalEntryType>`.
    typeChip_observation: { backgroundColor: theme.primaryLight },
    typeChip_harvest: { backgroundColor: theme.warningLight },
    typeChip_pest_disease: { backgroundColor: theme.errorLight },
    typeChip_issue: { backgroundColor: theme.errorLight },
    typeChip_milestone: { backgroundColor: theme.successLight },
    typeChip_other: { backgroundColor: theme.backgroundSecondary },
    typeChipText_observation: { color: theme.primary },
    typeChipText_harvest: { color: theme.warning },
    typeChipText_pest_disease: { color: theme.error },
    typeChipText_issue: { color: theme.error },
    typeChipText_milestone: { color: theme.success },
    typeChipText_other: { color: theme.textSecondary },
    dayHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
      marginTop: 8,
      marginBottom: -4,
    },
    dateText: {
      flexShrink: 1,
      fontSize: 12,
      color: theme.textTertiary,
    },
    // Built from structured fields ("Harvested 12 pcs", "Aphids on leaf").
    headlineText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      lineHeight: 21,
      marginTop: 10,
    },
    contentText: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 21,
      marginTop: 10,
    },
    // Notes beneath a headline read as supporting detail.
    contentTextUnderHeadline: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.textSecondary,
      marginTop: 2,
    },
    // One chip row: plant, harvest/pest details, then free tags.
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      maxWidth: '100%',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      flexShrink: 1,
    },
    chipPlant: {
      backgroundColor: theme.primaryLight,
    },
    chipPlantText: {
      color: theme.primary,
    },
    chipHarvest: {
      backgroundColor: theme.warningLight,
    },
    chipHarvestText: {
      color: theme.warning,
    },
    chipPest: {
      backgroundColor: theme.errorLight,
    },
    chipPestText: {
      color: theme.error,
    },
    chipMutedText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    chipTag: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
    },
    chipTagText: {
      fontWeight: '500',
      color: theme.textSecondary,
      textTransform: 'capitalize',
    },
    // Harvest quality tints (keyed by value)
    qualityexcellent: {
      backgroundColor: theme.primaryLight,
    },
    qualitygood: {
      backgroundColor: theme.primaryLight,
    },
    qualityfair: {
      backgroundColor: theme.warningLight,
    },
    qualitypoor: {
      backgroundColor: theme.errorLight,
    },
    // Pest severity / status tints (keyed by value)
    severity_low: {
      backgroundColor: theme.infoLight,
    },
    severity_medium: {
      backgroundColor: theme.warningLight,
    },
    severity_high: {
      backgroundColor: theme.errorLight,
    },
    severity_severe: {
      backgroundColor: theme.errorLight,
    },
    status_active: {
      backgroundColor: theme.errorLight,
    },
    status_treated: {
      backgroundColor: theme.warningLight,
    },
    status_resolved: {
      backgroundColor: theme.successLight,
    },
    // Fixed thumbnail row (no horizontal scroll — never fights the swipe gesture).
    // Up to three equal squares fill the width; a lone photo gets a wide frame.
    thumbRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 12,
    },
    thumbCell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: theme.backgroundSecondary,
    },
    thumbCellSingle: {
      aspectRatio: 16 / 9,
    },
    thumb: {
      width: '100%',
      height: '100%',
    },
    // A device-local photo that no longer loads (reinstall, web preview):
    // a small square placeholder instead of an empty 16:9 panel.
    thumbBroken: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderLight,
    },
    thumbMoreOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbMoreText: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.textInverse,
    },
    // Swipe-to-reveal actions (mirrors BedCard / bedListStyles)
    swipeActions: {
      flexDirection: 'row',
    },
    swipeResolveAction: {
      width: 72,
      backgroundColor: theme.success,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeEditAction: {
      width: 72,
      backgroundColor: theme.info,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeDeleteAction: {
      width: 72,
      backgroundColor: theme.error,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swipeActionText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textInverse,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 48,
      marginTop: 48,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    clearFiltersButton: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    clearFiltersText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textInverse,
    },
  });

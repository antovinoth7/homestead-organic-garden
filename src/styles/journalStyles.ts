import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

const cardShadow = (theme: Theme): object =>
  Platform.select({
    ios: {
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  });

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // ── Header — same bar, icon buttons and search field as Plants / Beds ──
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingBottom: 12,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
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
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIconBtnActive: {
      backgroundColor: theme.accent,
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
    searchExpandedRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    searchBackBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
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

    // ── List header: the stat tiles ──
    statsHeader: {
      paddingTop: 8,
      marginBottom: 2,
    },

    content: {
      flex: 1,
    },
    listContent: {
      // 16, not 20: the timeline rail already takes width from every card.
      paddingHorizontal: 16,
      paddingTop: 4,
      gap: 12,
    },
    dayHeader: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
      paddingTop: 10,
      paddingHorizontal: 2,
    },

    // ── Entry card, with its type icon on a timeline rail to the left ──
    entryRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    // Tinted by the same `typeChip_<type>` style as the pill label.
    railIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    card: {
      flex: 1,
      minWidth: 0,
      backgroundColor: theme.card,
      borderRadius: 16,
      paddingTop: 12,
      paddingHorizontal: 14,
      paddingBottom: 14,
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.border,
      ...cardShadow(theme),
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    // Label only — the icon lives on the rail beside the card.
    typeChip: {
      height: 28,
      justifyContent: 'center',
      paddingHorizontal: 10,
      borderRadius: 14,
    },
    typeChipText: {
      fontSize: 13,
      fontWeight: '700',
    },
    // Per-type tint for the type chip, keyed `typeChip_<JournalEntryType>`.
    typeChip_observation: { backgroundColor: theme.primaryLight },
    typeChip_harvest: { backgroundColor: theme.warningLight },
    typeChip_pest_disease: { backgroundColor: theme.errorLight },
    typeChip_issue: { backgroundColor: theme.errorLight },
    typeChip_milestone: { backgroundColor: theme.purpleLight },
    typeChip_other: { backgroundColor: theme.backgroundTertiary },
    typeChipText_observation: { color: theme.primary },
    typeChipText_harvest: { color: theme.warningDark },
    typeChipText_pest_disease: { color: theme.errorDark },
    typeChipText_issue: { color: theme.errorDark },
    typeChipText_milestone: { color: theme.purpleDark },
    typeChipText_other: { color: theme.textSecondary },
    dateText: {
      flex: 1,
      minWidth: 0,
      textAlign: 'right',
      fontSize: 13,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    moreButton: {
      width: 36,
      height: 36,
      marginVertical: -4,
      marginRight: -8,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Built from structured fields ("Harvested 12 pcs", "Aphids on leaf").
    headlineText: {
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 21,
      color: theme.text,
    },
    contentText: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.text,
    },
    // Harvest storage notes stand in when the entry has no notes of its own.
    contentTextMuted: {
      color: theme.textSecondary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      height: 28,
      maxWidth: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      borderRadius: 14,
    },
    chipText: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: '600',
    },
    chipPlant: {
      backgroundColor: theme.primaryLight,
    },
    chipPlantText: {
      color: theme.primary,
    },
    chipOutline: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderDark,
    },
    chipMutedText: {
      color: theme.textSecondary,
    },
    chipSevere: {
      backgroundColor: theme.errorLight,
    },
    chipSevereText: {
      color: theme.errorDark,
    },
    chipModerate: {
      backgroundColor: theme.warningLight,
    },
    chipModerateText: {
      color: theme.warningDark,
    },
    chipResolved: {
      backgroundColor: theme.successLight,
    },
    chipResolvedText: {
      color: theme.successDark,
    },
    chipTag: {
      backgroundColor: theme.backgroundTertiary,
    },
    chipTagText: {
      color: theme.textSecondary,
      textTransform: 'capitalize',
    },
    // Up to three equal squares fill the width; a lone photo gets a tall frame.
    thumbRow: {
      flexDirection: 'row',
      gap: 6,
      paddingTop: 2,
    },
    thumbCell: {
      flex: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.backgroundTertiary,
    },
    thumbCellSquare: {
      aspectRatio: 1,
    },
    thumbCellSingle: {
      height: 170,
    },
    thumb: {
      width: '100%',
      height: '100%',
    },
    // A device-local photo that no longer loads (reinstall, web preview):
    // a small square placeholder instead of an empty wide panel.
    thumbBroken: {
      flex: 0,
      width: 76,
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
    resolveButton: {
      alignSelf: 'flex-start',
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    resolveButtonText: {
      fontSize: 14.5,
      fontWeight: '600',
      color: theme.primary,
    },

    // ── Empty state ──
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 36,
      paddingHorizontal: 16,
    },
    emptyText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      marginTop: 8,
    },
    emptySubtext: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    clearFiltersButton: {
      marginTop: 6,
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: theme.primary,
    },
    clearFiltersText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textInverse,
    },
  });

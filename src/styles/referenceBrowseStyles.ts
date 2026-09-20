import { Dimensions, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Header bar, filter sheet and section divider shared by the pest, disease and
 * organic-input browse screens.
 *
 * These key sets used to live twice over, in `pestDiseaseListStyles` and
 * `organicInputListStyles`, because the two list views are near-copies of each
 * other. The card, banner and empty-state keys stay in those files — the cards
 * genuinely differ — but everything above the list is one sheet now.
 *
 * Geometry is ported from `managePlantCatalogStyles` so the four browse screens
 * line up pixel for pixel.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ---- Header bar -------------------------------------------------------
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /**
     * Title and subtitle share the middle of the bar. A zero min-width lets a
     * long title ellipsize rather than shove the search and funnel buttons off
     * the right edge.
     */
    headerTitleGroup: {
      flex: 1,
      minWidth: 0,
      marginLeft: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    /** Zone line, e.g. "36 in the High Rainfall Zone". */
    subtitle: {
      fontSize: 12,
      color: theme.inputPlaceholder,
      marginTop: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    /** Filled primary circle, matching the catalog and Plants headers. */
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
    /**
     * Dot saying the search icon hides a query that is still in force — the bar
     * collapses without clearing what was typed. Accent, because the button
     * beneath it is filled with the primary colour.
     */
    headerActiveDot: {
      position: 'absolute',
      bottom: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.accent,
    },
    /**
     * How many of the sheet's facets are off default. A plain dot could say only
     * that something was filtered, never whether one facet or all four were
     * responsible for the list on screen.
     */
    filterBadge: {
      position: 'absolute',
      top: 1,
      right: 1,
      minWidth: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    filterBadgeText: {
      fontSize: 9,
      color: theme.textInverse,
      fontWeight: '700',
      lineHeight: 14,
    },

    // ---- Expanded search --------------------------------------------------
    /** The chevron that collapses search, in place of the back button. */
    searchBackBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    /** Takes over the whole bar — title and both actions step aside for it. */
    searchExpandedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    /**
     * The flex is what makes the pill fill the row beside the chevron; without
     * it the field shrinks to its placeholder and runs past the header's right
     * edge on a narrow screen.
     */
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 40,
      borderRadius: 24,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.inputText,
      padding: 0,
    },

    // ---- Section divider --------------------------------------------------
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 16,
      paddingBottom: 2,
    },
    sectionTitle: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      flexShrink: 1,
    },
    sectionCount: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.inputPlaceholder,
    },

    // ---- Filter sheet -----------------------------------------------------
    sheetOverlay: {
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    sheetContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
    },
    sheetHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    sheetSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: theme.textSecondary,
      marginTop: 16,
      marginBottom: 8,
    },
    /** Reset pill, shown only while a facet is off its default. */
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
    /**
     * Four facets overflow a short screen, so the body scrolls. Capped rather
     * than sized to content so the list stays partly visible behind it.
     */
    sheetScroll: {
      maxHeight: Dimensions.get('window').height * 0.55,
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
    /**
     * The count on a chip. A zero is information — nothing here under your
     * other filters — so it is shown rather than hidden, but muted so it does
     * not read as an invitation.
     */
    sheetChipCountZero: {
      color: theme.textTertiary,
    },
  });

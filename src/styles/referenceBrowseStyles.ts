import { Dimensions, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';

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
      width: 44,
      height: 44,
      borderRadius: radius(theme, 'iconButton', 22),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
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
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    /** Zone line, e.g. "36 in the High Rainfall Zone". */
    subtitle: {
      fontSize: 12,
      color: theme.inputPlaceholder,
      marginTop: 1,
      ...font(theme, 'body'),
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
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
      textTransform: 'uppercase',
      color: theme.textTertiary,
      flexShrink: 1,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 0.9, fontWeight: '700' }),
    },
    sectionCount: {
      fontSize: 11,
      color: theme.inputPlaceholder,
      ...font(theme, 'bodyBold', '700'),
    },

    // ---- Filter sheet -----------------------------------------------------
    sheetOverlay: {
      backgroundColor: theme.overlay,
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    sheetContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
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
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    sheetSectionTitle: {
      textTransform: 'uppercase',
      color: theme.textSecondary,
      marginTop: 16,
      marginBottom: 8,
      ...eyebrow(theme, { fontSize: 13, letterSpacing: 0.5, fontWeight: '700' }),
    },
    /** Reset pill, shown only while a facet is off its default. */
    sheetClearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: radius(theme, 'button', 14),
      backgroundColor: theme.errorLight,
    },
    sheetClearText: {
      fontSize: 13,
      color: theme.error,
      ...font(theme, 'bodyStrong', '600'),
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
      borderRadius: radius(theme, 'chip', 20),
      backgroundColor: theme.backgroundSecondary,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.border,
      ...shadow(theme, 'chip'),
    },
    sheetChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    sheetChipText: {
      fontSize: 14,
      color: theme.textSecondary,
      ...font(theme, 'bodyMedium', '500'),
    },
    sheetChipTextActive: {
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
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

import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

const softShadow = (theme: Theme): object =>
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

/** Selectable tile/chip: card ground, primary tint when chosen. */
const pickable = (theme: Theme): object => ({
  backgroundColor: theme.card,
  borderWidth: 1.5,
  borderColor: theme.borderDark,
});

const picked = (theme: Theme): object => ({
  backgroundColor: theme.primaryLight,
  borderColor: theme.primary,
});

/** The chosen pill on a segmented track: card ground lifted off the track. */
const raised = (theme: Theme): object => ({
  backgroundColor: theme.card,
  ...Platform.select({
    ios: {
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
});

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollWrapper: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: theme.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderDark,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 14,
      paddingBottom: 24,
      gap: 18,
    },

    // ─── Entry type tiles ────────────────────────────────────────────────────
    typeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    typeTile: {
      flexBasis: '22%',
      flexGrow: 1,
      height: 66,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 4,
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
    },
    typeTileActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    typeTileText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    typeTileTextActive: {
      color: theme.textInverse,
    },

    // ─── Date / bed / plant rows ─────────────────────────────────────────────
    linkCard: {
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderDark,
      ...softShadow(theme),
    },
    linkRow: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingLeft: 16,
      paddingRight: 14,
      paddingVertical: 8,
    },
    linkRowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    linkRowLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    linkRowValueWrap: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-end',
    },
    linkRowValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    linkRowValueEmpty: {
      color: theme.textTertiary,
    },
    linkRowDetail: {
      fontSize: 12.5,
      fontWeight: '500',
      color: theme.textTertiary,
    },

    // ─── Section cards (harvest / pest-disease / milestone / after saving) ───
    sectionCard: {
      padding: 16,
      gap: 16,
      borderRadius: 18,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderDark,
      ...softShadow(theme),
    },
    sectionCardError: {
      borderWidth: 1.5,
      borderColor: theme.error,
    },
    fieldGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textSecondary,
    },
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minHeight: 38,
    },
    inputError: {
      borderColor: theme.error,
    },

    // Segmented control (harvest units, pest vs disease)
    segmentTrack: {
      flexDirection: 'row',
      gap: 2,
      padding: 4,
      borderRadius: 14,
      backgroundColor: theme.backgroundTertiary,
    },
    segment: {
      flex: 1,
      minWidth: 0,
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 10,
    },
    segmentActive: raised(theme),
    segmentText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    segmentTextActive: {
      color: theme.text,
    },

    // Equal-width options (quality, severity, status, remind days): the
    // compact sibling of `segmentTrack`/`segment` — one track, idle options
    // flat on it, the pick raised — so a stack of them stays lighter than a
    // row of bordered boxes and matches the Pest/Disease toggle above.
    optionGrid: {
      flexDirection: 'row',
      gap: 2,
      padding: 3,
      borderRadius: 12,
      backgroundColor: theme.backgroundTertiary,
    },
    optionTile: {
      flex: 1,
      minWidth: 0,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 2,
    },
    optionTileActive: raised(theme),
    optionTileText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    optionTileTextActive: {
      color: theme.primary,
      fontWeight: '700',
    },

    // ─── Harvest ─────────────────────────────────────────────────────────────
    quantityHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 10,
    },
    lastHint: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    stepButton: {
      width: 58,
      height: 58,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.borderDark,
    },
    stepButtonPrimary: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    amountInput: {
      flex: 1,
      minWidth: 0,
      height: 58,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.primary,
      backgroundColor: theme.background,
      textAlign: 'center',
      fontSize: 30,
      fontWeight: '600',
      color: theme.inputText,
      padding: 0,
    },

    // ─── Milestone ───────────────────────────────────────────────────────────
    milestoneGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    milestoneTile: {
      flexBasis: '47%',
      flexGrow: 1,
      height: 50,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      ...pickable(theme),
    },

    // ─── Notes + photos ──────────────────────────────────────────────────────
    notesBlock: {
      gap: 8,
    },
    notesInput: {
      minHeight: 110,
      maxHeight: 240,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
      backgroundColor: theme.card,
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
      fontSize: 16.5,
      lineHeight: 23,
      color: theme.inputText,
      textAlignVertical: 'top',
    },
    notesInputSmall: {
      minHeight: 76,
      maxHeight: 150,
      fontSize: 15.5,
      lineHeight: 21,
      borderWidth: 1,
      backgroundColor: theme.background,
    },
    notesFooter: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: -2,
    },
    notesFooterError: {
      flex: 1,
      minWidth: 0,
    },
    charCounter: {
      fontSize: 12.5,
      color: theme.textTertiary,
      textAlign: 'right',
    },
    addPhotoButton: {
      height: 52,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    addPhotoText: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.primary,
    },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingTop: 6,
    },
    photoTile: {
      width: 76,
      height: 76,
    },
    photoThumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    removePhotoButton: {
      position: 'absolute',
      top: -6,
      right: -6,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.text,
    },

    // ─── Tags ────────────────────────────────────────────────────────────────
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      minHeight: 42,
      paddingHorizontal: 14,
      borderRadius: 21,
      justifyContent: 'center',
      ...pickable(theme),
    },
    tagChipActive: picked(theme),
    tagChipText: {
      fontSize: 14.5,
      fontWeight: '600',
      color: theme.text,
      textTransform: 'capitalize',
    },
    tagChipTextActive: {
      color: theme.primary,
    },

    // ─── Sticky Save bar ─────────────────────────────────────────────────────
    saveBar: {
      paddingHorizontal: 18,
      paddingTop: 12,
      backgroundColor: theme.background,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
    },
    saveButton: {
      height: 58,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textInverse,
    },

    // ─── Pest / disease suggestions ──────────────────────────────────────────
    suggestionHeading: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textTertiary,
      marginTop: -6,
    },
    // Bleeds past the section card's 16pt padding so tiles scroll off the
    // card edge instead of being clipped inside it; the content padding puts
    // the first tile back in line with the fields above. The negative top
    // margin pulls the row up to its heading, off the card's 16pt field gap.
    suggestionRow: {
      marginHorizontal: -16,
      marginTop: -8,
    },
    suggestionRowContent: {
      paddingHorizontal: 16,
      gap: 10,
    },
    // Fixed width, not a column share: at 360–390pt three full tiles and a
    // sliver of the fourth show, and that sliver is the cue that the row
    // scrolls. A 320pt screen shows two and a half. The photo fills the
    // square unrounded; `overflow: 'hidden'` gives it the tile's corners.
    suggestionTile: {
      width: 96,
      aspectRatio: 1,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: theme.backgroundTertiary,
    },
    // Lower two-thirds of the tile: the gradient's clear top keeps the
    // subject visible while its green foot carries a two-line name.
    suggestionTileScrim: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: '65%',
    },
    // Laid over the scrim. The shadow is for bright photos where the
    // gradient's lighter top reaches the second line of a wrapped name.
    suggestionTileName: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 8,
      paddingBottom: 8,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.textInverse,
      textShadowColor: theme.shadow,
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    groupLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    // ─── Affected parts / effectiveness chips ────────────────────────────────
    affectedPartChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
      marginBottom: 12,
    },
    affectedPartChip: {
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 13,
      borderRadius: 20,
      ...pickable(theme),
    },
    affectedPartChipActive: picked(theme),
    affectedPartChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    affectedPartChipTextActive: {
      color: theme.primary,
    },
    effChipEffectiveActive: {
      backgroundColor: theme.success,
      borderColor: theme.success,
    },
    effChipPartialActive: {
      backgroundColor: theme.warning,
      borderColor: theme.warning,
    },
    effChipIneffectiveActive: {
      backgroundColor: theme.error,
      borderColor: theme.error,
    },
    effChipTextActive: {
      color: theme.textInverse,
    },
    notesWrapperMarginTop: {
      marginTop: 12,
    },

    // ─── Treatments ──────────────────────────────────────────────────────────
    treatmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 10,
    },
    effortLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    effortLegendText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.textTertiary,
      marginRight: 4,
    },
    effortDot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },
    effortEasy: { backgroundColor: theme.success },
    effortModerate: { backgroundColor: theme.warning },
    effortAdvanced: { backgroundColor: theme.error },
    treatmentGroupContainer: {
      gap: 10,
      marginBottom: 8,
    },
    treatmentGroup: {
      gap: 6,
    },
    treatmentGroupLabel: {
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: theme.textTertiary,
    },
    treatmentGroupChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    treatmentChip: {
      alignSelf: 'flex-start',
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 13,
      borderRadius: 21,
      ...pickable(theme),
    },
    treatmentChipActive: picked(theme),
    treatmentChipContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    treatmentChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
    },
    treatmentChipTextActive: {
      color: theme.primary,
    },

    // ─── Pest follow-up ("After saving") ──────────────────────────────────────
    followUpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 44,
    },
    followUpText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
    },
    followUpDetail: {
      marginLeft: 32,
      gap: 8,
    },
    followUpHint: {
      fontSize: 12.5,
      color: theme.textTertiary,
    },

    // ─── More details disclosure (optional harvest / pest fields) ───────────
    moreDetails: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      paddingTop: 6,
    },
    moreToggle: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    moreToggleText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.primary,
    },
    moreSummary: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      color: theme.textTertiary,
      marginLeft: 4,
    },
    moreBody: {
      marginTop: 6,
    },
  });

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

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
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: 12,
      paddingTop: 12,
    },
    // ─── Entry type pill bar ─────────────────────────────────────────────────
    typeBar: {
      flexGrow: 0,
      marginBottom: 12,
    },
    typeBarContent: {
      gap: 8,
    },
    typePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: theme.primaryLight,
    },
    typePillActive: {
      backgroundColor: theme.primary,
    },
    typePillText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
    typePillTextActive: {
      color: theme.textInverse,
    },
    // ─── Field label row (label left, compact dictation pill right) ──────────
    fieldLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 6,
      minHeight: 28,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 6,
    },
    // ─── Notes ───────────────────────────────────────────────────────────────
    notesBlock: {
      marginBottom: 12,
    },
    notesInput: {
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 15,
      lineHeight: 21,
      color: theme.inputText,
      minHeight: 96,
      maxHeight: 220,
      textAlignVertical: 'top',
    },
    notesInputSmall: {
      minHeight: 64,
      maxHeight: 140,
    },
    notesInputError: {
      borderColor: theme.error,
    },
    // ─── Photo strip ─────────────────────────────────────────────────────────
    photoStrip: {
      gap: 8,
      paddingBottom: 4,
    },
    addPhotoTile: {
      width: 64,
      height: 64,
      borderRadius: 12,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    addPhotoTileText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.primary,
    },
    photoTile: {
      width: 64,
      height: 64,
    },
    photoThumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    removePhotoButton: {
      position: 'absolute',
      top: 3,
      right: 3,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // ─── Type detail card (harvest / pest-disease / milestone) ───────────────
    harvestSection: {
      backgroundColor: theme.backgroundSecondary,
      padding: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    harvestSectionError: {
      borderColor: theme.error,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    /* Harvest capture — amount and unit on one row, quality in one row. */
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    amountInput: {
      width: 84,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 10,
      paddingVertical: 6,
      paddingHorizontal: 6,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.inputText,
    },
    amountInputError: {
      borderColor: theme.error,
    },
    unitSegments: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
    },
    qualityRow: {
      flexDirection: 'row',
      gap: 6,
    },
    qualityChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 4,
      backgroundColor: theme.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 6,
    },
    labelSpaced: {
      marginTop: 12,
    },
    input: {
      backgroundColor: theme.inputBackground,
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
      color: theme.inputText,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    unitButton: {
      flex: 1,
      paddingVertical: 9,
      paddingHorizontal: 2,
      backgroundColor: theme.background,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    unitButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    unitButtonText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    unitButtonTextActive: {
      color: theme.primary,
    },
    qualityButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    qualityButton: {
      flex: 1,
      padding: 8,
      backgroundColor: theme.background,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    qualityButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    qualityChipText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    qualityButtonText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    qualityButtonTextActive: {
      color: theme.primary,
    },
    charCounter: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: 'right',
      marginTop: 4,
    },
    notesWrapperMarginTop: {
      marginTop: 12,
    },
    tagsSection: {
      marginBottom: 12,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tagChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    tagChipText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    tagChipTextActive: {
      color: theme.primary,
    },
    // ─── Header save button ──────────────────────────────────────────────────
    headerCenter: {
      flex: 1,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.primary,
    },
    saveButtonDisabled: {
      backgroundColor: theme.borderDark,
    },
    saveText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textInverse,
    },
    saveTextDisabled: {
      color: theme.textInverse,
      opacity: 0.7,
    },
    // ─── Location (bed → plant) ──────────────────────────────────────────────
    locationSection: {
      marginBottom: 12,
    },
    locationHint: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
      marginBottom: 8,
    },
    // ─── Pest/Disease kind toggle ────────────────────────────────────────────
    pdKindRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    pdKindChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    pdKindChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    pdKindChipText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    pdKindChipTextActive: {
      color: theme.primary,
    },
    // ─── Preset suggestion groups ────────────────────────────────────────────
    suggestionGroupContainer: {
      marginBottom: 12,
    },
    suggestionGroup: {
      marginBottom: 8,
    },
    suggestionGroupLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      letterSpacing: 0.3,
    },
    groupLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 6,
    },
    suggestionGroupChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 16,
      backgroundColor: theme.accentLight,
    },
    suggestionChipActive: {
      backgroundColor: theme.primaryLight,
    },
    suggestionChipText: {
      fontSize: 13,
      color: theme.accent,
    },
    suggestionChipTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    // ─── Occurred date button ────────────────────────────────────────────────
    dateButton: {
      backgroundColor: theme.inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    // Suggestions hidden — the date follows the name field directly.
    dateButtonSpaced: {
      marginTop: 10,
    },
    dateButtonText: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '500',
    },
    datePlaceholder: {
      fontSize: 15,
      color: theme.inputPlaceholder,
    },
    // ─── Affected parts / effectiveness chips ────────────────────────────────
    affectedPartChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    affectedPartChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    affectedPartChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    affectedPartChipText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    affectedPartChipTextActive: {
      color: theme.primary,
      fontWeight: '600',
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
      fontWeight: '600',
    },
    // ─── Treatment groups ────────────────────────────────────────────────────
    helperText: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: -2,
      marginBottom: 12,
    },
    treatmentGroupContainer: {
      marginBottom: 8,
    },
    treatmentGroup: {
      marginBottom: 8,
    },
    treatmentGroupLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
      letterSpacing: 0.3,
    },
    treatmentChipContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    effortDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    effortEasy: { backgroundColor: theme.success },
    effortModerate: { backgroundColor: theme.warning },
    effortAdvanced: { backgroundColor: theme.error },
    treatmentGroupChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    treatmentChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 4,
    },
    treatmentChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    treatmentChipText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    treatmentChipTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    // ─── Milestone kind grid ─────────────────────────────────────────────────
    milestoneGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    milestoneChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    milestoneChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    milestoneChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    milestoneChipTextActive: {
      color: theme.primary,
    },
    // ─── More details disclosure (optional harvest / pest fields) ───────────
    moreDetails: {
      marginTop: 10,
    },
    moreToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
    },
    moreToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.primary,
    },
    moreSummary: {
      flex: 1,
      fontSize: 12,
      color: theme.textTertiary,
      marginLeft: 6,
    },
    moreBody: {
      marginTop: 6,
    },
  });

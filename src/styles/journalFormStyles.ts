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
      padding: 16,
      paddingTop: 12,
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
    stickySaveContainer: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.background,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    stickySaveButton: {
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stickySaveButtonDisabled: {
      backgroundColor: theme.borderDark,
    },
    stickySaveButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textInverse,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingBottom: 16,
    },
    photosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    photoContainer: {
      position: 'relative',
      width: '48%',
      aspectRatio: 1,
    },
    photoThumbnail: {
      width: '100%',
      height: '100%',
      borderRadius: 12,
    },
    removePhotoButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: theme.overlay,
      borderRadius: 12,
    },
    addPhotoButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      marginBottom: 16,
    },
    addPhotoText: {
      fontSize: 16,
      color: theme.primary,
      marginLeft: 8,
      fontWeight: '600',
    },
    textArea: {
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      color: theme.inputText,
      minHeight: 150,
      maxHeight: 300,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    typeSelector: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 6,
    },
    typeButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      paddingHorizontal: 2,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.primaryLight,
      gap: 4,
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 10,
      color: theme.primary,
      fontWeight: '600',
      textAlign: 'center',
    },
    typeButtonTextActive: {
      color: theme.textInverse,
    },
    harvestSection: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    harvestSectionError: {
      borderColor: theme.error,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    /* Harvest capture — hero amount + unit segments + wrapping quality chips. */
    amountBlock: {
      marginBottom: 16,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 4,
    },
    amountInput: {
      minWidth: 140,
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      fontSize: 32,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.inputText,
    },
    amountInputError: {
      borderColor: theme.error,
    },
    amountUnitSuffix: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
      minWidth: 56,
    },
    unitSegments: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },
    qualityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    qualityChip: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      paddingHorizontal: 8,
      backgroundColor: theme.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
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
    unitButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    unitButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 6,
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
      fontSize: 13,
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
      fontSize: 13,
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
    notesWrapper: {
      marginBottom: 4,
    },
    charCounter: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: 'right',
      marginTop: -6,
    },
    notesWrapperMarginTop: {
      marginTop: 12,
    },
    tagsSection: {
      marginBottom: 16,
    },
    tagsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
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
    keyboardSpacer: {
      height: 300,
    },
    voiceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    voiceLocaleRow: {
      flexDirection: 'row',
      gap: 8,
    },
    voiceLocaleChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    voiceLocaleChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    voiceLocaleChipText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    voiceLocaleChipTextActive: {
      color: theme.primary,
    },
    voicePreview: {
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.textSecondary,
      marginBottom: 8,
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
      marginBottom: 16,
    },
    locationHint: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: -4,
      marginBottom: 8,
    },
    // ─── Pest/Disease kind toggle ────────────────────────────────────────────
    pdKindRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    pdKindChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
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
      paddingVertical: 8,
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
      padding: 14,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
      paddingVertical: 8,
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
      paddingVertical: 8,
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
      paddingVertical: 10,
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
  });

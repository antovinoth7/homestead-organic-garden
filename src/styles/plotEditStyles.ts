import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { MONO_FONT } from '@/styles/typography';

/**
 * Styles for the full-page plot editor (`PlotEditModal`) and the soil chip
 * groups it hosts (`LocationProfileEditor`). One scrolling page of cards — no
 * tabs — so every field of a farm plot is visible at once.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // ── Page chrome ──────────────────────────────────────────────────────────
    page: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 16,
      paddingBottom: 13,
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleWrap: {
      flex: 1,
      paddingHorizontal: 8,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    saveButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: 20,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 3,
    },
    saveButtonDisabled: {
      backgroundColor: theme.borderDark,
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textInverse,
    },
    saveButtonTextDisabled: {
      color: theme.textTertiary,
    },
    scrollContent: {
      padding: 14,
      paddingBottom: 22,
      gap: 12,
    },

    // ── Card shell ───────────────────────────────────────────────────────────
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderLight,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 13,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    cardDivider: {
      height: 1,
      backgroundColor: theme.borderLight,
    },

    // ── Identity rows ────────────────────────────────────────────────────────
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 11,
    },
    fieldRowFirst: {
      paddingTop: 0,
    },
    fieldRowLast: {
      paddingBottom: 0,
    },
    fieldLabel: {
      width: 96,
      fontSize: 13,
      fontWeight: '600',
      color: theme.textTertiary,
    },
    fieldInput: {
      flex: 1,
      textAlign: 'right',
      fontSize: 15.5,
      fontWeight: '600',
      color: theme.text,
      padding: 0,
    },
    fieldInputMono: {
      fontFamily: MONO_FONT,
      fontWeight: '700',
      letterSpacing: 1,
    },
    shortNameHint: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: 'right',
      paddingBottom: 11,
      marginTop: -4,
    },

    // ── Size stepper ─────────────────────────────────────────────────────────
    sizeLabelWrap: {
      flex: 1,
      minWidth: 0,
    },
    sizeSubtitle: {
      fontSize: 11.5,
      color: theme.textTertiary,
      marginTop: 2,
      fontFamily: MONO_FONT,
    },
    stepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stepperButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperButtonText: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.primary,
      lineHeight: 24,
    },
    stepperValueWrap: {
      minWidth: 60,
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
    },
    stepperValue: {
      fontSize: 19,
      fontWeight: '700',
      color: theme.primary,
      fontFamily: MONO_FONT,
    },
    stepperUnit: {
      fontSize: 12,
      color: theme.textSecondary,
    },

    // ── Coordinates ──────────────────────────────────────────────────────────
    coordInputs: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
    },
    coordInput: {
      flex: 1,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 11,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.inputText,
      textAlign: 'center',
      fontFamily: MONO_FONT,
    },
    coordInputError: {
      borderColor: theme.error,
    },
    coordTip: {
      fontSize: 12,
      color: theme.textTertiary,
      lineHeight: 17,
      marginTop: 9,
    },

    // ── Soil chip groups ─────────────────────────────────────────────────────
    groupLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginBottom: 9,
    },
    groupLabelSpaced: {
      marginTop: 15,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 9,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.borderLight,
      backgroundColor: theme.background,
    },
    chipSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    chipText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    chipTextSelected: {
      color: theme.primary,
    },
    chipTextMono: {
      fontFamily: MONO_FONT,
    },

    // Full-width segmented controls (drainage, moisture, wind, NPK).
    segmentRow: {
      flexDirection: 'row',
      gap: 6,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
      backgroundColor: theme.background,
    },
    segmentSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    segmentText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    segmentTextSelected: {
      color: theme.primary,
    },
    npkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 6,
    },
    npkRowLast: {
      marginBottom: 0,
    },
    npkLetter: {
      width: 12,
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      fontFamily: MONO_FONT,
    },
    npkSegments: {
      flex: 1,
      flexDirection: 'row',
      gap: 6,
    },

    // ── Soil test date ───────────────────────────────────────────────────────
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    dateIconTile: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateContent: {
      flex: 1,
    },
    dateLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.55,
      textTransform: 'uppercase',
      color: theme.textTertiary,
    },
    dateValue: {
      fontSize: 14.5,
      fontWeight: '600',
      color: theme.text,
      marginTop: 2,
      fontFamily: MONO_FONT,
    },
    datePlaceholder: {
      fontSize: 14,
      color: theme.inputPlaceholder,
      marginTop: 2,
    },
    staleBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
      backgroundColor: theme.warningLight,
      borderWidth: 1,
      borderColor: theme.warningBorder,
      borderRadius: 11,
      paddingHorizontal: 11,
      paddingVertical: 9,
      marginTop: 10,
    },
    staleBannerText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.warningDark,
    },

    // ── Notes ────────────────────────────────────────────────────────────────
    notesDivider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginVertical: 13,
    },
    notesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    notesLabel: {
      flex: 1,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.textTertiary,
    },
    notesInput: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      borderRadius: 12,
      padding: 12,
      marginTop: 9,
      fontSize: 14,
      lineHeight: 20,
      color: theme.inputText,
      minHeight: 76,
      textAlignVertical: 'top',
    },
    notesCounter: {
      fontSize: 11.5,
      color: theme.textTertiary,
      textAlign: 'right',
      marginTop: 6,
      fontFamily: MONO_FONT,
    },

    // ── Delete ───────────────────────────────────────────────────────────────
    deleteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.errorBorder,
      borderRadius: 16,
      padding: 14,
    },
    deleteIconTile: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: theme.errorLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteTextWrap: {
      flex: 1,
    },
    deleteTitle: {
      fontSize: 14.5,
      fontWeight: '700',
      color: theme.error,
    },
    deleteSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    usageLine: {
      fontSize: 12.5,
      color: theme.textTertiary,
      textAlign: 'center',
    },
  });

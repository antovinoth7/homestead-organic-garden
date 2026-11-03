import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';

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
      borderRadius: radius(theme, 'iconButton', 17),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    headerTitleWrap: {
      flex: 1,
      paddingHorizontal: 8,
    },
    headerTitle: {
      fontSize: 17,
      color: theme.text,
      textAlign: 'center',
      ...font(theme, 'title', '700'),
    },
    saveButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingVertical: 9,
      borderRadius: radius(theme, 'button', 20),
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 3,
      ...shadow(theme, 'button'),
    },
    saveButtonDisabled: {
      backgroundColor: theme.borderDark,
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      fontSize: 14,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
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
      borderWidth: border(theme, 'card', 1),
      borderColor: theme.borderLight,
      borderRadius: radius(theme, 'card', 16),
      paddingHorizontal: 14,
      paddingVertical: 13,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      ...shadow(theme, 'card'),
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
    fieldLabel: {
      width: 96,
      fontSize: 13,
      color: theme.textTertiary,
      ...font(theme, 'bodyStrong', '600'),
    },
    fieldInput: {
      flex: 1,
      textAlign: 'right',
      fontSize: 15.5,
      color: theme.text,
      padding: 0,
      ...font(theme, 'bodyStrong', '600'),
    },
    /** Short name — a 5-char uppercase code, spaced out to read as one. */
    fieldInputCode: {
      letterSpacing: 1,
      ...font(theme, 'bodyBold', '700'),
    },
    shortNameHint: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: 'right',
      paddingBottom: 11,
      marginTop: -4,
      ...font(theme, 'body'),
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
      ...font(theme, 'body'),
    },
    stepperControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    stepperButton: {
      width: 38,
      height: 38,
      borderRadius: radius(theme, 'iconButton', 19),
      backgroundColor: theme.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepperButtonText: {
      fontSize: 20,
      color: theme.primary,
      lineHeight: 24,
      ...font(theme, 'bodyStrong', '600'),
    },
    stepperValueWrap: {
      minWidth: 60,
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
    },
    stepperValue: {
      fontSize: 19,
      color: theme.primary,
      ...font(theme, 'bodyBold', '700'),
    },
    stepperUnit: {
      fontSize: 12,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },

    // ── Coordinates ──────────────────────────────────────────────────────────
    // Stacked rather than sharing a row with the 96px label: two boxes plus the
    // label do not fit the card on a narrow screen, and the second one clips.
    coordRow: {
      paddingTop: 11,
      gap: 8,
    },
    /** Stacked, so the label sizes to its text instead of the row's 96px column. */
    coordLabel: {
      width: 'auto',
    },
    coordInputs: {
      flexDirection: 'row',
      gap: 8,
    },
    coordInput: {
      flex: 1,
      minWidth: 0,
      backgroundColor: theme.background,
      borderWidth: border(theme, 'input', 1),
      borderColor: theme.inputBorder,
      borderRadius: radius(theme, 'input', 10),
      paddingHorizontal: 11,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.inputText,
      textAlign: 'center',
      ...font(theme, 'body'),
    },
    coordInputError: {
      borderColor: theme.error,
    },
    coordTip: {
      fontSize: 12,
      color: theme.textTertiary,
      lineHeight: 17,
      marginTop: 9,
      ...font(theme, 'body'),
    },

    // ── Soil chip groups ─────────────────────────────────────────────────────
    groupLabel: {
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginBottom: 9,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 0.9, fontWeight: '700' }),
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
      borderRadius: radius(theme, 'chip', 19),
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.borderLight,
      backgroundColor: theme.background,
    },
    chipSelected: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    chipText: {
      fontSize: 13.5,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    chipTextSelected: {
      color: theme.primary,
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
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
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
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
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
      textTransform: 'uppercase',
      color: theme.textTertiary,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 0.55, fontWeight: '700' }),
    },
    dateValue: {
      fontSize: 14.5,
      color: theme.text,
      marginTop: 2,
      ...font(theme, 'bodyStrong', '600'),
    },
    datePlaceholder: {
      fontSize: 14,
      color: theme.inputPlaceholder,
      marginTop: 2,
      ...font(theme, 'body'),
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
      ...font(theme, 'body'),
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
      textTransform: 'uppercase',
      color: theme.textTertiary,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 0.9, fontWeight: '700' }),
    },
    notesInput: {
      backgroundColor: theme.background,
      borderWidth: border(theme, 'input', 1),
      borderColor: theme.inputBorder,
      borderRadius: radius(theme, 'input', 12),
      padding: 12,
      marginTop: 9,
      fontSize: 14,
      lineHeight: 20,
      color: theme.inputText,
      minHeight: 76,
      textAlignVertical: 'top',
      ...font(theme, 'body'),
    },
    notesCounter: {
      fontSize: 11.5,
      color: theme.textTertiary,
      textAlign: 'right',
      marginTop: 6,
      ...font(theme, 'body'),
    },

    // ── Delete ───────────────────────────────────────────────────────────────
    deleteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.errorBorder,
      borderRadius: radius(theme, 'card', 16),
      padding: 14,
      ...shadow(theme, 'card'),
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
      color: theme.error,
      ...font(theme, 'bodyBold', '700'),
    },
    deleteSubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    usageLine: {
      fontSize: 12.5,
      color: theme.textTertiary,
      textAlign: 'center',
      ...font(theme, 'body'),
    },
  });

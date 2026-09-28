import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

/**
 * Shared styles for the journal's own bottom sheets — entry actions, resolve
 * prompt, entry date and the filter sheet. The dim backdrop and rise live in
 * `BottomSheetModal`; this is only the card and its contents.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 20,
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: { elevation: 16 },
      }),
    },
    body: {
      gap: 10,
      paddingTop: 4,
    },
    title: {
      fontSize: 21,
      fontWeight: '700',
      color: theme.text,
    },
    subtitle: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.textSecondary,
      marginTop: -4,
    },
    message: {
      fontSize: 15.5,
      lineHeight: 22,
      color: theme.textSecondary,
      paddingBottom: 4,
    },

    // ── Full-width action rows ──
    actionRow: {
      minHeight: 56,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 18,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.borderDark,
    },
    actionRowPrimary: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    actionRowDanger: {
      backgroundColor: theme.errorDark,
      borderColor: theme.errorDark,
      justifyContent: 'center',
    },
    actionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    actionTextOnPrimary: {
      color: theme.textInverse,
    },
    actionTextDanger: {
      color: theme.errorDark,
    },
    actionTextCentered: {
      flex: 0,
      textAlign: 'center',
    },
    ghostButton: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ghostButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
    },

    // ── Resolve prompt ──
    questionBox: {
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: theme.cautionLight,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.cautionBorder,
    },
    questionText: {
      fontSize: 15,
      lineHeight: 21,
      fontWeight: '500',
      color: theme.text,
    },
    answerDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    answerDotEffective: { backgroundColor: theme.heroRingFill },
    answerDotPartial: { backgroundColor: theme.warning },
    answerDotIneffective: { backgroundColor: theme.error },

    // ── Entry date ──
    quickRow: {
      flexDirection: 'row',
      gap: 8,
    },
    quickPick: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
    },
    quickPickActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    quickPickText: {
      fontSize: 14.5,
      fontWeight: '600',
      color: theme.text,
    },
    quickPickTextActive: {
      color: theme.primary,
    },
    pickRow: {
      minHeight: 56,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderDark,
    },
    pickRowLabel: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    pickRowValue: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textTertiary,
      textAlign: 'center',
    },

    // ── Filter sheet ──
    filterHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingBottom: 4,
    },
    clearAllButton: {
      minHeight: 36,
      paddingHorizontal: 14,
      borderRadius: 18,
      justifyContent: 'center',
      backgroundColor: theme.errorLight,
    },
    clearAllText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.errorDark,
    },
    // Shrinks inside the sheet's maxHeight so the Show button stays on screen.
    filterScroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    filterScrollContent: {
      gap: 18,
      paddingBottom: 12,
    },
    filterSection: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
      color: theme.textTertiary,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: 22,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
    },
    chipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    chipText: {
      fontSize: 14.5,
      fontWeight: '600',
      color: theme.text,
      textTransform: 'capitalize',
    },
    chipTextActive: {
      color: theme.primary,
    },
    chipCount: {
      fontSize: 12.5,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    placeRow: {
      minHeight: 56,
      paddingVertical: 8,
      paddingLeft: 16,
      paddingRight: 12,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
    },
    placeRowActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    placeRowBody: {
      flex: 1,
      minWidth: 0,
    },
    placeRowLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    placeRowLabelActive: {
      color: theme.primary,
    },
    placeRowHint: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.textTertiary,
    },
    showButton: {
      minHeight: 56,
      marginTop: 6,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
    },
    showButtonText: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.textInverse,
    },
  });

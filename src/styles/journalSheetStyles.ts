import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { eyebrow, font, radius, shadow } from '@/theme/styleTokens';

/**
 * Shared styles for the journal's own bottom sheets — entry actions, resolve
 * prompt, entry date and the filter sheet. The dim backdrop and rise live in
 * `BottomSheetModal`; this is only the card and its contents.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 24),
      borderTopRightRadius: radius(theme, 'sheet', 24),
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
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: -4,
      ...font(theme, 'bodyMedium', '500'),
    },
    message: {
      fontSize: 15.5,
      lineHeight: 22,
      color: theme.textSecondary,
      paddingBottom: 4,
      ...font(theme, 'body'),
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
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
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
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
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
      color: theme.text,
      ...font(theme, 'bodyMedium', '500'),
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
      borderRadius: radius(theme, 'card', 12),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
      ...shadow(theme, 'card'),
    },
    quickPickActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    quickPickText: {
      fontSize: 14.5,
      color: theme.text,
      ...font(theme, 'bodyStrong', '600'),
    },
    quickPickTextActive: {
      color: theme.primary,
    },
    pickRow: {
      minHeight: 56,
      borderRadius: radius(theme, 'card', 14),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.borderDark,
      ...shadow(theme, 'card'),
    },
    pickRowLabel: {
      flex: 1,
      fontSize: 16,
      color: theme.textSecondary,
      ...font(theme, 'bodyStrong', '600'),
    },
    pickRowValue: {
      fontSize: 16,
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
    footnote: {
      fontSize: 13,
      color: theme.textTertiary,
      textAlign: 'center',
      ...font(theme, 'bodyMedium', '500'),
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
      borderRadius: radius(theme, 'button', 18),
      justifyContent: 'center',
      backgroundColor: theme.errorLight,
    },
    clearAllText: {
      fontSize: 14,
      color: theme.errorDark,
      ...font(theme, 'bodyStrong', '600'),
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
      textTransform: 'uppercase',
      color: theme.textTertiary,
      ...eyebrow(theme, { fontSize: 12.5, letterSpacing: 0.9, fontWeight: '700' }),
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      minHeight: 44,
      paddingHorizontal: 14,
      borderRadius: radius(theme, 'chip', 22),
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
      color: theme.text,
      textTransform: 'capitalize',
      ...font(theme, 'bodyStrong', '600'),
    },
    chipTextActive: {
      color: theme.primary,
    },
    chipCount: {
      fontSize: 12.5,
      color: theme.textTertiary,
      ...font(theme, 'bodyMedium', '500'),
    },
    placeRow: {
      minHeight: 56,
      paddingVertical: 8,
      paddingLeft: 16,
      paddingRight: 12,
      borderRadius: radius(theme, 'card', 14),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.borderDark,
      ...shadow(theme, 'card'),
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
      color: theme.text,
      ...font(theme, 'bodyBold', '700'),
    },
    placeRowLabelActive: {
      color: theme.primary,
    },
    placeRowHint: {
      fontSize: 13,
      color: theme.textTertiary,
      ...font(theme, 'bodyMedium', '500'),
    },
    showButton: {
      minHeight: 56,
      marginTop: 6,
      borderRadius: radius(theme, 'button', 16),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      ...shadow(theme, 'button'),
    },
    showButtonText: {
      fontSize: 17,
      color: theme.textInverse,
      ...font(theme, 'bodyBold', '700'),
    },
  });

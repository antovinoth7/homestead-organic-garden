import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { border, eyebrow, font, radius, shadow } from '@/theme/styleTokens';

/** Styles for `SectionEditSheet` — the create/rename bottom sheet for sections. */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: radius(theme, 'sheet', 26),
      borderTopRightRadius: radius(theme, 'sheet', 26),
      paddingHorizontal: 20,
      // Fallback for the runtime safe-area inset the sheet passes in; without
      // either, the translucent nav bar sits over the sheet's bottom edge.
      paddingBottom: 24,
    },
    header: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 18,
      color: theme.text,
      ...font(theme, 'title', '700'),
    },
    subtitle: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    // The app's shared close treatment — 36px primary circle, white glyph — as
    // used by every other sheet and modal header (Create task, plant form).
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: radius(theme, 'iconButton', 18),
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow(theme, 'iconButton'),
    },
    label: {
      textTransform: 'uppercase',
      color: theme.textTertiary,
      marginTop: 20,
      ...eyebrow(theme, { fontSize: 11, letterSpacing: 0.9, fontWeight: '700' }),
    },
    input: {
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.primary,
      borderRadius: 13,
      paddingHorizontal: 15,
      paddingVertical: 14,
      marginTop: 8,
      fontSize: 16,
      color: theme.inputText,
      ...font(theme, 'bodyStrong', '600'),
    },
    usageLine: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginTop: 10,
      ...font(theme, 'body'),
    },
    quickRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
      marginTop: 14,
    },
    quickLabel: {
      fontSize: 11.5,
      color: theme.textTertiary,
      ...font(theme, 'body'),
    },
    quickChip: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: radius(theme, 'chip', 9),
      backgroundColor: theme.primaryLight,
      borderWidth: border(theme, 'chip', 1),
      borderColor: theme.borderLight,
    },
    quickChipText: {
      fontSize: 12.5,
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    // Header pill, matching the plot editor's header save.
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
  });

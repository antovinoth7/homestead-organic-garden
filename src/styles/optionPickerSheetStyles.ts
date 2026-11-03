import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { eyebrow, font, radius, shadow } from '@/theme/styleTokens';

/**
 * Styles for the shared option-picker bottom sheet. Extracted from
 * `themedDropdownStyles` so the sheet can be opened from any trigger — the
 * dropdown's own bordered row, or the catalog screen's dense read-first row.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // The dim backdrop and tap-outside-to-close live in BottomSheetModal.
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: radius(theme, 'sheet', 20),
      borderTopRightRadius: radius(theme, 'sheet', 20),
      paddingHorizontal: 8,
      // maxHeight is computed at runtime (window height minus insets) and passed
      // in via the style array so the sheet never extends behind the nav bar.
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 16,
        },
      }),
    },
    sheetTitle: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: 'center' as const,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingVertical: 8,
      ...font(theme, 'bodyStrong', '600'),
    },
    sheetSubtitle: {
      fontSize: 13.5,
      lineHeight: 19,
      color: theme.textTertiary,
      textAlign: 'center' as const,
      paddingHorizontal: 20,
      marginTop: -4,
      marginBottom: 10,
      ...font(theme, 'body'),
    },
    // Section header inside a grouped list ("Recently used", "In pots").
    groupHeader: {
      color: theme.textTertiary,
      textTransform: 'uppercase',
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 6,
      ...eyebrow(theme, { fontSize: 12, letterSpacing: 0.9, fontWeight: '700' }),
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.pickerBackground,
      borderRadius: radius(theme, 'card', 10),
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      marginHorizontal: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
      minHeight: 42,
      ...shadow(theme, 'card'),
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      ...font(theme, 'body'),
    },
    // Searchable sheets have a fixed height; the list takes what the search leaves.
    list: {
      flex: 1,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
      gap: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: 'center',
      ...font(theme, 'body'),
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 10,
      marginHorizontal: 4,
      minHeight: 52,
    },
    optionRowSelected: {
      backgroundColor: theme.primaryLight,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      letterSpacing: 0.15,
      marginRight: 8,
      ...font(theme, 'body', '400'),
    },
    optionTextSelected: {
      color: theme.primary,
      ...font(theme, 'bodyStrong', '600'),
    },
    optionDescription: {
      fontSize: 12.5,
      color: theme.textTertiary,
      marginTop: 2,
      ...font(theme, 'body'),
    },
    optionBody: {
      flex: 1,
      marginRight: 8,
    },
    clearRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginHorizontal: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
      minHeight: 52,
    },
    clearRowText: {
      fontSize: 16,
      color: theme.textSecondary,
      ...font(theme, 'body'),
    },
  });

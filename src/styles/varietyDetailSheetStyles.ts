import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/**
 * The variety editor wears the same chrome as the other catalog edit sheets
 * (`catalogSheetStyles`): card surface, handle + small uppercase title, a
 * full-width Done at the foot. Its notes field and season chips follow the
 * catalog detail rows (`catalogRowStyles`) so the sheet reads as part of the
 * screen it opens from.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      // Keeps the handle and Done in frame however far the keyboard padding
      // pushes the sheet up; the fields between them scroll.
      maxHeight: '90%',
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
      fontWeight: '600',
      color: theme.textTertiary,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    // Shrinks (rather than pushing Done off) when the sheet is clamped to
    // maxHeight or the keyboard reduces the available space.
    scroll: {
      flexShrink: 1,
    },
    scrollContent: {
      paddingTop: 4,
      paddingBottom: 4,
    },
    fieldLabel: {
      fontSize: 12.5,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    seasonChipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    seasonChip: {
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    seasonChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    seasonChipText: {
      fontSize: 13,
      color: theme.text,
    },
    seasonChipTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    // Notes: label left, the compact mic | language pill right — the same row
    // the catalog's Description and pruning-tip blocks use.
    notesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    notesLabel: {
      fontSize: 12.5,
      color: theme.textSecondary,
      flexShrink: 1,
    },
    notesInput: {
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.inputText,
      minHeight: 74,
      textAlignVertical: 'top',
      marginBottom: 12,
      ...Platform.select({ ios: { paddingTop: 10 } }),
    },
    doneButton: {
      backgroundColor: theme.primary,
      borderRadius: 24,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 4,
      marginBottom: 8,
    },
    doneButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.textInverse,
    },
  });

import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { MONO_FONT } from './typography';

/**
 * Dense "read-first" rows inside the catalog section cards: label on the left,
 * value on the right, tap to edit. Deliberately tighter than `PickerField`,
 * which stacks its label above its value and is a card rather than a row.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    /**
     * The separator belongs to the whole group — row plus any hint or error —
     * so trailing copy reads as part of the field above it rather than as a
     * caption on the field below.
     */
    rowGroup: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    rowGroupLast: {
      borderBottomWidth: 0,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      minHeight: 44,
    },
    rowError: {
      backgroundColor: theme.errorLight,
    },
    labelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
      minWidth: 0,
    },
    label: {
      fontSize: 13,
      color: theme.textSecondary,
      flexShrink: 1,
    },
    valueWrap: {
      flex: 1,
      alignItems: 'flex-end',
      minWidth: 0,
    },
    value: {
      fontSize: 14.5,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'right',
    },
    valuePlaceholder: {
      color: theme.textTertiary,
      fontWeight: '400',
    },
    hint: {
      fontSize: 11.5,
      fontStyle: 'italic',
      color: theme.textTertiary,
      paddingHorizontal: 14,
      paddingBottom: 10,
      marginTop: -6,
    },
    errorWrap: {
      paddingHorizontal: 14,
      paddingBottom: 8,
      marginTop: -4,
    },

    // ---- Range row --------------------------------------------------------
    rangeValues: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    rangeChip: {
      minWidth: 52,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
      backgroundColor: theme.background,
    },
    rangeChipText: {
      fontFamily: MONO_FONT,
      fontSize: 14,
      color: theme.text,
      textAlign: 'center',
    },
    rangeChipPlaceholder: {
      color: theme.textTertiary,
    },
    rangeDash: {
      fontSize: 12,
      color: theme.textTertiary,
    },
    rangeUnit: {
      fontSize: 12,
      color: theme.textTertiary,
      marginLeft: 2,
    },

    // ---- Badge value (read-only, e.g. pet toxicity) ------------------------
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
    },
    badgeText: {
      fontSize: 12.5,
      fontWeight: '700',
    },

    // ---- Free-text block (description, pruning tips) ----------------------
    block: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.borderLight,
    },
    blockLast: {
      borderBottomWidth: 0,
    },
    blockHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    blockLabel: {
      fontSize: 12.5,
      color: theme.textSecondary,
    },
    blockInput: {
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.inputText,
      minHeight: 74,
      textAlignVertical: 'top',
      ...Platform.select({ ios: { paddingTop: 10 } }),
    },

    // ---- Chip list --------------------------------------------------------
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipText: {
      fontSize: 13,
      color: theme.text,
    },
    chipSub: {
      fontFamily: MONO_FONT,
      fontSize: 11,
      color: theme.textTertiary,
    },
    chipBody: {
      flexShrink: 1,
      minWidth: 0,
    },
    chipInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
      minWidth: 0,
    },
    chipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.primary,
    },
    chipEmpty: {
      fontSize: 13,
      fontStyle: 'italic',
      color: theme.textTertiary,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },

    // ---- Care status strip ------------------------------------------------
    statusStrip: {
      marginHorizontal: 14,
      marginTop: 12,
      marginBottom: 4,
      padding: 11,
      borderRadius: 10,
      backgroundColor: theme.background,
    },
    statusStripRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    statusStripTitle: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.text,
    },
    statusStripNote: {
      fontSize: 11.5,
      lineHeight: 17,
      color: theme.textSecondary,
      marginTop: 3,
    },
  });

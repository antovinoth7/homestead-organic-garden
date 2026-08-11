import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (
  theme: Theme,
  compact: boolean
): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Option A: iOS Settings row — label left, value right
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.pickerBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      paddingHorizontal: 16,
      minHeight: compact ? 40 : 44,
      marginBottom: compact ? 8 : 10,
    },
    triggerDisabled: {
      opacity: 0.45,
    },
    triggerLeading: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginRight: 8,
    },
    // Left-side label (always visible)
    triggerLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textTertiary,
      flexShrink: 1,
    },
    triggerLabelDisabled: {
      color: theme.textTertiary,
    },
    // Right-side selected value
    triggerText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'right' as const,
      flexShrink: 1,
      maxWidth: '58%',
      marginRight: 6,
    },
    triggerPlaceholder: {
      color: theme.inputPlaceholder,
      fontWeight: '400',
    },
    triggerTextDisabled: {
      color: theme.textTertiary,
    },
    triggerTextNoLabel: {
      flex: 1,
      textAlign: 'left' as const,
      maxWidth: '100%' as const,
    },
    // Kept for backward compat — no longer used visually
    triggerWithLabel: {},
    floatingLabel: {
      position: 'absolute' as const,
      top: -9,
      left: 12,
      paddingHorizontal: 4,
      fontSize: 12,
      fontWeight: '500',
      color: theme.textSecondary,
      backgroundColor: theme.backgroundSecondary,
    },
  });

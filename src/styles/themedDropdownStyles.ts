import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { font, radius, shadow } from '@/theme/styleTokens';

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
      borderRadius: radius(theme, 'card', 12),
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      paddingHorizontal: 16,
      minHeight: compact ? 40 : 44,
      marginBottom: compact ? 8 : 10,
      ...shadow(theme, 'card'),
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
      color: theme.textTertiary,
      flexShrink: 1,
      ...font(theme, 'bodyMedium', '500'),
    },
    triggerLabelDisabled: {
      color: theme.textTertiary,
    },
    // Right-side selected value
    triggerText: {
      fontSize: 14,
      color: theme.text,
      textAlign: 'right' as const,
      flexShrink: 1,
      maxWidth: '58%',
      marginRight: 6,
      ...font(theme, 'bodyStrong', '600'),
    },
    triggerPlaceholder: {
      color: theme.inputPlaceholder,
      ...font(theme, 'body', '400'),
    },
    triggerTextDisabled: {
      color: theme.textTertiary,
    },
    triggerTextNoLabel: {
      flex: 1,
      textAlign: 'left' as const,
      maxWidth: '100%' as const,
    },
  });

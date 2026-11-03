import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { border, font, radius } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      borderWidth: border(theme, 'input', 1),
      borderRadius: radius(theme, 'input', 12),
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBackground,
      marginBottom: 12,
      paddingHorizontal: 16,
      minHeight: 56,
      justifyContent: 'center',
    },
    containerMultiline: {
      minHeight: 80,
      justifyContent: 'flex-start',
      paddingTop: 18,
    },
    containerWithHelp: {
      paddingRight: 42,
    },
    containerFocused: {
      borderWidth: 2,
    },
    /** Applied to the field when an error row takes over the bottom spacing. */
    containerFlush: {
      marginBottom: 0,
    },
    errorWrapper: {
      marginBottom: 12,
    },
    label: {
      position: 'absolute',
      left: 12,
      paddingHorizontal: 4,
      ...font(theme, 'bodyMedium', '500'),
    },
    labelWithHelp: {
      maxWidth: '82%',
    },
    input: {
      fontSize: 16,
      paddingVertical: Platform.OS === 'ios' ? 18 : 14,
      paddingHorizontal: 0,
    },
    inputWithHelp: {
      paddingRight: 2,
    },
    inputMultiline: {
      paddingTop: 4,
      textAlignVertical: 'top',
    },
    helpSlot: {
      position: 'absolute',
      right: 12,
      zIndex: 2,
    },
    helpSlotSingle: {
      top: 18,
    },
    helpSlotMultiline: {
      top: 12,
    },
  });

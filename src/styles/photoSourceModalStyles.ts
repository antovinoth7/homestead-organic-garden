import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      paddingHorizontal: 12,
    },
    optionGroup: {
      borderRadius: 14,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
    },
    optionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.border,
    },
    optionText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    cancelButton: {
      marginTop: 10,
      paddingVertical: 16,
      borderRadius: 14,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.primary,
    },
  });

import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    sheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
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
    helpText: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    rangeFields: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    rangeField: {
      flex: 1,
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

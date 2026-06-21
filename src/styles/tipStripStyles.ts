import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    strip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.warningLight,
      borderWidth: 1,
      borderColor: theme.warning + '40',
    },
    icon: {
      fontSize: 16,
    },
    text: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      lineHeight: 18,
    },
    close: {
      padding: 2,
    },
  });

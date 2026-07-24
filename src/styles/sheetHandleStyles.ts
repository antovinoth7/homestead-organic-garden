import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Full width so a bordered title child still spans the whole sheet. The
    // trailing gap lives on the pill, not here, so a title child's own bottom
    // border stays flush with the end of the header block.
    handleArea: {
      width: '100%' as const,
      paddingTop: 12,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: 'center' as const,
      marginBottom: 4,
    },
  });

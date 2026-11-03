import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { radius } from '@/theme/styleTokens';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Full width so a bordered title child still spans the whole sheet. The
    // trailing gap lives on the pill, not here, so a title child's own bottom
    // border stays flush with the end of the header block.
    handleArea: {
      width: '100%' as const,
      paddingTop: 12,
    },
    // A palette with its own sheet shape (Meadow) uses a slightly larger,
    // stronger grab handle.
    handle: {
      width: theme.style.radii.sheet ? 44 : 40,
      height: theme.style.radii.sheet ? 5 : 4,
      borderRadius: radius(theme, 'bar', 2),
      backgroundColor: theme.style.radii.sheet ? theme.borderDark : theme.border,
      alignSelf: 'center' as const,
      marginBottom: 4,
    },
  });

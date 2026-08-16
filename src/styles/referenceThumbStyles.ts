import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    rowImage: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.backgroundSecondary,
    },
    rowFallback: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipImage: {
      width: 20,
      height: 20,
      borderRadius: 4,
      backgroundColor: theme.backgroundSecondary,
    },
    chipFallback: {
      width: 20,
      height: 20,
      borderRadius: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroImage: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.backgroundSecondary,
    },
    heroFallback: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundSecondary,
    },
    // Top corners only: the photo sits flush against the top edge of its tile
    // card, which owns the bottom two. Sized by ratio rather than a fixed
    // height, so it grows with the column instead of being pinned to one device
    // width.
    //
    // Square: the photo leads the tile rather than capping it. The bundled
    // sources are 400 x 300, so this renders their centre 300 x 300 and crops
    // the sides — acceptable for centred crop subjects, and the reason not to
    // push the ratio past 1.
    tileImage: {
      width: '100%',
      aspectRatio: 1,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      backgroundColor: theme.backgroundTertiary,
    },
    tileFallback: {
      width: '100%',
      aspectRatio: 1,
      borderTopLeftRadius: 14,
      borderTopRightRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.backgroundTertiary,
    },
  });

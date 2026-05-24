import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

export const TILE_WIDTH = 110;
export const TILE_GAP = 8;
export const TILE_STEP = TILE_WIDTH + TILE_GAP;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    scrollContent: {
      flexDirection: 'row' as const,
      paddingHorizontal: 10,
      paddingBottom: 10,
      paddingTop: 4,
      gap: TILE_GAP,
    },
    tileWrapper: {
      width: TILE_WIDTH,
    },
    tileWrapperDragging: {
      zIndex: 10,
      elevation: 8,
      opacity: 0.92,
      shadowColor: theme.text,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
  });

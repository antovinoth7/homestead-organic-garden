import { Dimensions, StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

const SCREEN = Dimensions.get('window');

/** Width of one pager page. Also used for `getItemLayout` / index maths. */
export const PAGE_WIDTH = SCREEN.width;
/** Laid-out image height. `usePinchZoom` derives its pan bounds from the same ratio. */
export const IMAGE_HEIGHT = SCREEN.height * 0.8;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    gestureRoot: {
      flex: 1,
    },
    zoomOverlay: {
      flex: 1,
      backgroundColor: theme.shadow,
      justifyContent: 'center',
      alignItems: 'center',
    },
    zoomClose: {
      position: 'absolute',
      top: 16,
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.textInverse + '33',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    counter: {
      position: 'absolute',
      alignSelf: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      backgroundColor: theme.textInverse + '33',
      zIndex: 10,
    },
    counterText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textInverse,
    },
    /** Sized to its content so the overlay keeps it vertically centred. */
    pager: {
      flexGrow: 0,
      width: PAGE_WIDTH,
    },
    /** One full-width pager page. */
    page: {
      width: PAGE_WIDTH,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageBox: {
      width: PAGE_WIDTH,
      height: IMAGE_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: PAGE_WIDTH,
      height: IMAGE_HEIGHT,
    },
  });

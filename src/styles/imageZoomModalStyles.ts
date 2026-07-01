import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

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
    zoomGestureContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

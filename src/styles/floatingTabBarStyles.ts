import { Platform, StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';
import { font, radius, shadow } from '@/theme/styleTokens';

const SHADOW_COLOR = '#000';

const createDockedStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      backgroundColor: theme.tabBarBackground,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      paddingTop: 8,
      // Shadow for elevation
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
        } as Record<string, unknown>,
      }),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    iconWrap: {},
    iconWrapActive: {},
    label: {
      fontSize: 10,
      fontWeight: '500',
    },
    labelFocused: {
      fontWeight: '600',
    },
    iconLabelSpacer: {
      height: 2,
    },
  });

/**
 * Floating pill bar (Meadow): inset from the sides and the bottom, fully
 * rounded, lifted by its own shadow. The active tab's icon sits in a
 * `primaryLight` pill.
 */
const createFloatingStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: theme.style.tabBar.inset,
      right: theme.style.tabBar.inset,
      flexDirection: 'row',
      backgroundColor: theme.tabBarBackground,
      borderRadius: radius(theme, 'tabBar', 30),
      paddingTop: 8,
      paddingBottom: 9,
      paddingHorizontal: 6,
      ...shadow(theme, 'tabBar'),
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrap: {
      width: 46,
      height: 28,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive:
      theme.style.tabBar.activeMark === 'pill' ? { backgroundColor: theme.primaryLight } : {},
    label: {
      fontSize: 10.5,
      ...font(theme, 'bodyStrong', '600'),
    },
    labelFocused: {},
    iconLabelSpacer: {
      height: 3,
    },
  });

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  theme.style.tabBar.floating ? createFloatingStyles(theme) : createDockedStyles(theme);

export const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  fabTouchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

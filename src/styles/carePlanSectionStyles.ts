import { StyleSheet } from 'react-native';
import type { Theme } from '@/theme/colors';

/**
 * Care Plan list chrome around the cards: the summary line, collapsible
 * section headers with their preview line, and the per-plot weather banner.
 */
export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 44,
      marginBottom: 8,
      paddingVertical: 6,
      paddingLeft: 12,
      paddingRight: 6,
      borderRadius: 12,
      backgroundColor: theme.infoSurface,
      borderWidth: 1,
      borderColor: theme.infoBorder,
    },
    bannerText: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      lineHeight: 18,
      color: theme.text,
    },
    bannerHead: {
      fontWeight: '700',
    },
    bannerButton: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 22,
      backgroundColor: theme.infoDark,
    },
    // The banner's own ground as the label colour: dark on the light blue
    // button in dark mode, white on the deep blue one in light mode.
    bannerButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.infoSurface,
    },
    bannerUndo: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.infoDark,
    },
    bannerUndoText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.infoDark,
    },
  });

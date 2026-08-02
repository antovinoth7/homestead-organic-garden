/**
 * Needs-action list — an edge-to-edge white list rather than stacked cards, so
 * a long day scrolls as one surface instead of a wall of boxes.
 *
 * Rows carry no inline action: tapping opens the item. Dividers are indented
 * past the icon tile so the eye follows the titles down the column.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // Each row carries the surface itself: the list is virtualized, so there is
    // no wrapper element to paint it on. The screen's separator supplies the
    // hairline between rows.
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minHeight: 44,
      paddingHorizontal: 20,
      paddingVertical: 11,
      backgroundColor: theme.card,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCritical: {
      backgroundColor: theme.errorLight,
    },
    iconWarning: {
      backgroundColor: theme.cautionLight,
    },
    iconInfo: {
      backgroundColor: theme.infoLight,
    },
    iconGlyph: {
      fontSize: 17,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 14.5,
      fontWeight: '600',
      color: theme.text,
    },
    // Where the item is. Sits directly under the name and is weighted above the
    // reason line: on a multi-plot farm this is what decides whether the grower
    // acts on it during this walk or the next one.
    where: {
      fontSize: 12.5,
      fontWeight: '500',
      color: theme.textSecondary,
      marginTop: 2,
    },
    meta: {
      fontSize: 12.5,
      color: theme.textTertiary,
      marginTop: 2,
    },
    chevron: {
      fontSize: 18,
      color: theme.textTertiary,
    },
  });

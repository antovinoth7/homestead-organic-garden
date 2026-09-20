/**
 * Plot carousel — the rail the plot cards ride on when a farm has more than one.
 *
 * The card is tall, not wide, so paging buys back the height of every plot after
 * the first.
 *
 * The peek is what makes the rail read as swipeable — a sliver of the next card
 * past the gutter says "there is more" without a hint line asking for the swipe.
 */

import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';
import { CARD_GUTTER } from './todayScreenStyles';

/** How much of the next card shows past the active one's right edge. */
export const CARD_PEEK = 26;

/** Between two pages. Part of the snap interval, so it must not be a margin. */
export const CARD_GAP = 12;

/** A page's width at this screen width — the snap interval is this plus the gap. */
export function plotCardWidth(screenWidth: number): number {
  return screenWidth - CARD_GUTTER * 2 - CARD_PEEK;
}

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // The rail sits where a single card's top margin would put it, so the block
    // starts in the same place whether or not the farm has a second plot.
    rail: {
      marginTop: 12,
    },
    // Padding rather than margins on the pages: `snapToInterval` measures from
    // the content's left edge, and a leading margin would offset every snap.
    railContent: {
      paddingHorizontal: CARD_GUTTER,
      gap: CARD_GAP,
    },

    // ─── Indicator ───────────────────────────────────────────────────────────
    // A few small marks and nothing else: this reports position, it does not
    // offer a way to change it — the swipe already does that — so it stays quiet
    // enough not to compete with the tab bar at the bottom of the screen.
    dots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      marginTop: 14,
      paddingHorizontal: CARD_GUTTER,
    },
    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.border,
    },
    // The active page stretches into a pill, so the current position is legible
    // without relying on the colour difference alone.
    dotActive: {
      width: 16,
      backgroundColor: theme.primary,
    },
  });

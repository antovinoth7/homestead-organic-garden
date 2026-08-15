import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    /** Outer spacing between the weather block and neighbouring dashboard cards. */
    outer: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
    },
    /** Visual card chrome (no outer margins — `outer`/deck layers own positioning). */
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 2,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 10,
    },
    locationLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    /**
     * Watering advice strip. Rendered in both the rainy and dry state, on one
     * line, with a fixed height — cards for different plots are stacked in the
     * deck and must all measure the same regardless of their weather.
     */
    weatherLine: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 30,
      paddingHorizontal: 10,
      borderRadius: 8,
      borderWidth: 1,
      marginBottom: 10,
    },
    weatherLineRain: {
      backgroundColor: theme.infoLight,
      borderColor: theme.info + '40',
    },
    weatherLineDry: {
      backgroundColor: theme.backgroundTertiary,
      borderColor: theme.border,
    },
    weatherLineEmoji: {
      fontSize: 12,
      lineHeight: 16,
    },
    weatherLineText: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: theme.text,
    },
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayCol: {
      alignItems: 'center',
      flex: 1,
      gap: 3,
    },
    dayLabel: {
      fontSize: 11,
      lineHeight: 14,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    dayEmoji: {
      fontSize: 18,
      lineHeight: 22,
    },
    dayTemp: {
      fontSize: 11,
      lineHeight: 14,
      color: theme.text,
      fontWeight: '600',
    },
    /** Fixed height: the slot is rendered on dry days too, holding the row's shape. */
    dayRain: {
      fontSize: 10,
      lineHeight: 13,
      height: 13,
      color: theme.info,
    },
    dayRainEmpty: {
      color: theme.textTertiary,
    },
    /** Placeholder while plot locations load — roughly one forecast card tall. */
    loadingCard: {
      minHeight: 120,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // ─── Stacked swipeable deck (multiple plots) ───────────────────────────────
    /**
     * Height is set by WeatherDeck to the tallest card plus the peek reserve, so
     * the block does not resize as you swipe between plots. `minHeight` only holds
     * the space on the first frame, before the cards have been measured.
     */
    deckContainer: {
      position: 'relative',
      minHeight: 170,
    },
    /**
     * All cards — front and behind — are layers, so they share one origin and the
     * front card can't dictate the deck's geometry. No height here: the layer is
     * sized by its card, which is how a taller card gets measured and grows the deck.
     */
    deckCardLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
    },
    swipeHint: {
      alignItems: 'center',
      marginBottom: 8,
    },
    swipeHintText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: 6,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.border,
    },
    dotActive: {
      backgroundColor: theme.primary,
      width: 18,
    },
  });

/**
 * WeatherDeck — a Tinder-style stacked, swipeable deck of per-plot forecasts.
 *
 * Used when a farm has multiple plots: the top card shows one plot's forecast
 * with the next cards fanned out beneath it; swiping the top card past a
 * threshold flings it away and cycles to the next plot. Built on RN built-ins
 * (`Animated` + `PanResponder`) — no reanimated/gesture-handler needed.
 *
 * Every card is sized to the tallest card in the deck (`cardHeight`), not to
 * whichever card happens to be in front. A plot with rain has a taller natural
 * card than a dry one, so sizing to the front card made the taller cards behind
 * spill out below it and made the whole block resize on every swipe.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/weatherCardStyles';
import { WeatherPlotCard } from './WeatherPlotCard';
import { getWeatherForecast } from '@/services/weather';
import type { WeatherPlot } from '@/hooks/useWeatherLocations';

const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY = 0.5;
const MAX_BEHIND = 2;

/** Resting offset of each card behind the front one — the fan-out under the deck. */
const PEEK_OFFSET = 12;
const PEEK_SCALE_STEP = 0.04;
const PEEK_OPACITY_STEP = 0.25;
/** Room reserved below the front card for the deepest peeking card to show in. */
const PEEK_RESERVE = PEEK_OFFSET * MAX_BEHIND + 4;

interface Props {
  plots: WeatherPlot[];
}

export const WeatherDeck = React.memo(function WeatherDeck({ plots }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const n = plots.length;
  const nRef = useRef(n);
  nRef.current = n;

  const [topIndex, setTopIndex] = useState(0);
  // Tallest card measured so far. Monotonic: once every card is stretched to it,
  // they all report it back, so it settles after the tallest plot has mounted.
  const [cardHeight, setCardHeight] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const screenW = useWindowDimensions().width;

  // A different farm means different cards — re-measure from scratch rather than
  // inheriting the previous farm's height.
  useEffect(() => {
    setCardHeight(0);
    setTopIndex(0);
  }, [plots]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Only claim horizontal drags so the parent ScrollView still scrolls vertically.
        // The drag feed must stay JS-driven (PanResponder gestures can't drive the
        // native Animated.event path) — only the release animations run natively.
        onMoveShouldSetPanResponder: (_evt, g) =>
          Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 8,
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_evt, g) => {
          const flung = Math.abs(g.dx) > SWIPE_THRESHOLD || Math.abs(g.vx) > SWIPE_VELOCITY;
          if (flung) {
            const dir = g.dx >= 0 ? 1 : -1;
            Animated.timing(pan, {
              toValue: { x: dir * (screenW + 80), y: g.dy },
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              pan.setValue({ x: 0, y: 0 });
              setTopIndex((i) => (i + 1) % nRef.current);
            });
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [pan, screenW]
  );

  const rotate = useMemo(
    () =>
      pan.x.interpolate({
        inputRange: [-screenW / 2, 0, screenW / 2],
        outputRange: ['-8deg', '0deg', '8deg'],
        extrapolate: 'clamp',
      }),
    [pan.x, screenW]
  );

  // Drag progress 0→1 toward the swipe threshold (either direction): the next
  // card rises into the front card's place *while* the front card is dragged
  // away, so the index shuffle at release is visually continuous. The resting
  // ends of these ranges must match the depth-1 resting transform below.
  const nextCardScale = useMemo(
    () =>
      pan.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
        outputRange: [1, 1 - PEEK_SCALE_STEP, 1],
        extrapolate: 'clamp',
      }),
    [pan.x]
  );
  const nextCardTranslateY = useMemo(
    () =>
      pan.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
        outputRange: [0, PEEK_OFFSET, 0],
        extrapolate: 'clamp',
      }),
    [pan.x]
  );
  const nextCardOpacity = useMemo(
    () =>
      pan.x.interpolate({
        inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
        outputRange: [1, 1 - PEEK_OPACITY_STEP, 1],
        extrapolate: 'clamp',
      }),
    [pan.x]
  );

  // Warm the forecast cache for every plot up front (dedup + 3h freshness make
  // this cheap), so swiping to a card beyond the mounted layers never loads.
  useEffect(() => {
    plots.forEach((p) => {
      void getWeatherForecast(p.lat, p.lng);
    });
  }, [plots]);

  // Grow the deck to the tallest card. Every layer reports — a rainy plot sitting
  // *behind* a dry one is the tall card, and measuring only the front card is what
  // let it overflow the deck. Layers are sized by their card (no fixed height), so
  // a card taller than the current max is measured at its natural height and grows
  // `cardHeight`; once every card is stretched to it, this settles.
  const onCardLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    setCardHeight((prev) => (h > prev ? h : prev));
  }, []);

  // Behind cards: up to MAX_BEHIND, rendered deepest-first so the front card
  // (rendered last) sits on top.
  const behind = useMemo(() => {
    const layers: { plot: WeatherPlot; plotIndex: number; depth: number }[] = [];
    for (let d = Math.min(n - 1, MAX_BEHIND); d >= 1; d--) {
      const plotIndex = (topIndex + d) % n;
      layers.push({ plot: plots[plotIndex]!, plotIndex, depth: d });
    }
    return layers;
  }, [plots, topIndex, n]);

  return (
    <View style={styles.outer}>
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>✦ Swipe for more farms ✦</Text>
      </View>

      <View
        style={[
          styles.deckContainer,
          cardHeight > 0 ? { height: cardHeight + PEEK_RESERVE } : null,
        ]}
      >
        {/* Layers are keyed by plot index (not stack position) so cycling the
            deck reorders existing elements instead of remounting them — card
            state (fetched forecast, layout) survives every swipe. */}
        {behind.map(({ plot, plotIndex, depth }) => (
          <Animated.View
            key={`card-${plotIndex}`}
            pointerEvents="none"
            onLayout={onCardLayout}
            style={[
              styles.deckCardLayer,
              depth === 1
                ? {
                    opacity: nextCardOpacity,
                    transform: [{ translateY: nextCardTranslateY }, { scale: nextCardScale }],
                  }
                : {
                    opacity: 1 - PEEK_OPACITY_STEP * depth,
                    transform: [
                      { translateY: PEEK_OFFSET * depth },
                      { scale: 1 - PEEK_SCALE_STEP * depth },
                    ],
                  },
            ]}
          >
            <WeatherPlotCard plot={plot} minHeight={cardHeight} />
          </Animated.View>
        ))}

        <Animated.View
          key={`card-${topIndex}`}
          onLayout={onCardLayout}
          style={[
            styles.deckCardLayer,
            { transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] },
          ]}
          {...panResponder.panHandlers}
        >
          <WeatherPlotCard plot={plots[topIndex]!} minHeight={cardHeight} />
        </Animated.View>
      </View>

      <View style={styles.dotsRow}>
        {plots.map((plot, i) => (
          <View key={`${plot.name}-${i}`} style={[styles.dot, i === topIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
});

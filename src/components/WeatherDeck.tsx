/**
 * WeatherDeck — a Tinder-style stacked, swipeable deck of per-plot forecasts.
 *
 * Used when a farm has multiple plots: the top card shows one plot's forecast
 * with the next cards peeking behind it; swiping the top card past a threshold
 * flings it away and cycles to the next plot. Built on RN built-ins
 * (`Animated` + `PanResponder`) — no reanimated/gesture-handler needed.
 */

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Animated, PanResponder, Dimensions } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/weatherCardStyles';
import { WeatherPlotCard } from './WeatherPlotCard';
import type { WeatherPlot } from '@/hooks/useWeatherLocations';

const SWIPE_THRESHOLD = 120;
const SWIPE_VELOCITY = 0.5;
const MAX_BEHIND = 2;

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
  const [deckHeight, setDeckHeight] = useState(0);
  const pan = useRef(new Animated.ValueXY()).current;
  const screenW = Dimensions.get('window').width;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Only claim horizontal drags so the parent ScrollView still scrolls vertically.
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
              useNativeDriver: false,
            }).start(() => {
              pan.setValue({ x: 0, y: 0 });
              setTopIndex((i) => (i + 1) % nRef.current);
            });
          } else {
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 6,
              useNativeDriver: false,
            }).start();
          }
        },
      }),
    [pan, screenW]
  );

  const rotate = pan.x.interpolate({
    inputRange: [-screenW / 2, 0, screenW / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  // Behind cards: up to MAX_BEHIND, rendered deepest-first so the front card
  // (rendered last, in normal flow) sits on top.
  const behind: { plot: WeatherPlot; depth: number }[] = [];
  for (let d = Math.min(n - 1, MAX_BEHIND); d >= 1; d--) {
    behind.push({ plot: plots[(topIndex + d) % n]!, depth: d });
  }

  return (
    <View style={styles.outer}>
      <View style={styles.swipeHint}>
        <Text style={styles.swipeHintText}>✦ Swipe for more farms ✦</Text>
      </View>

      <View style={styles.deckContainer}>
        {behind.map(({ plot, depth }) => (
          <Animated.View
            key={`behind-${depth}`}
            pointerEvents="none"
            style={[
              styles.deckCardLayer,
              deckHeight > 0 ? { height: deckHeight } : null,
              { transform: [{ translateY: -10 * depth }, { scale: 1 - 0.05 * depth }] },
            ]}
          >
            <WeatherPlotCard plot={plot} />
          </Animated.View>
        ))}

        <Animated.View
          key={`front-${topIndex}`}
          onLayout={(e) => setDeckHeight(e.nativeEvent.layout.height)}
          style={{ transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }] }}
          {...panResponder.panHandlers}
        >
          <WeatherPlotCard plot={plots[topIndex]!} />
        </Animated.View>
      </View>

      <View style={styles.dotsRow}>
        {plots.map((plot, i) => (
          <View
            key={`${plot.name}-${i}`}
            style={[styles.dot, i === topIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
});

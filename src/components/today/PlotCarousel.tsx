/**
 * PlotCarousel — the plot cards as one swipeable rail.
 *
 * A plot card is tall rather than wide, so stacking them spends a screen height
 * per plot and pushes everything the Today screen says after them below the
 * fold. Paging spends one card's height whatever the farm holds, and a swipe is
 * the easiest gesture to make one-handed at 6:42 in the morning with the phone
 * in the hand that is not carrying anything.
 *
 * The dots under the rail say how many plots there are and which one is in
 * front. They are a caption, not a control: a swipe is the way between pages,
 * so nothing here competes with the tab bar at the bottom of the screen.
 *
 * One plot is not a carousel. A rail that hides nothing and pages nowhere is
 * chrome for its own sake, so a single-plot farm gets the plain full-width card
 * it had before, with no dots and no caption.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { PlotBrief } from '@/types/database.types';
import { useTheme } from '@/theme';
import { CARD_GAP, createStyles, plotCardWidth } from '@/styles/plotCarouselStyles';
import { PlotCard, PlotHealthFilter } from './PlotCard';

interface Props {
  plots: readonly PlotBrief[];
  onPressPlot: (plotId: string) => void;
  onPressWeather: (plotId: string) => void;
  onPressHealth: (plotId: string, status: PlotHealthFilter) => void;
  onPressBeds: () => void;
}

export const PlotCarousel = React.memo(function PlotCarousel({
  plots,
  onPressPlot,
  onPressWeather,
  onPressHealth,
  onPressBeds,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);

  const cardWidth = plotCardWidth(width);
  const interval = cardWidth + CARD_GAP;
  const pageStyle = useMemo(
    () => ({ width: cardWidth, marginHorizontal: 0, marginTop: 0 }),
    [cardWidth]
  );

  // Momentum end rather than every scroll frame: the dots and the caption only
  // have to be right once the rail has settled, and this keeps the rail off the
  // JS thread while the finger is down.
  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(event.nativeEvent.contentOffset.x / interval);
      setActive(Math.min(Math.max(page, 0), plots.length - 1));
    },
    [interval, plots.length]
  );

  if (plots.length === 0) return null;

  if (plots.length === 1) {
    return (
      <PlotCard
        plot={plots[0]!}
        onPress={onPressPlot}
        onPressWeather={onPressWeather}
        onPressHealth={onPressHealth}
        onPressBeds={onPressBeds}
      />
    );
  }

  // Guards the dots against a plot being removed while a later page was showing
  // — `active` is state, so it can outlive the list it indexed.
  const current = Math.min(active, plots.length - 1);

  return (
    <View>
      <ScrollView
        style={styles.rail}
        contentContainerStyle={styles.railContent}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={interval}
        snapToAlignment="start"
        disableIntervalMomentum
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {plots.map((plot) => (
          <PlotCard
            key={plot.id}
            plot={plot}
            containerStyle={pageStyle}
            onPress={onPressPlot}
            onPressWeather={onPressWeather}
            onPressHealth={onPressHealth}
            onPressBeds={onPressBeds}
          />
        ))}
      </ScrollView>

      {/* Position, spoken once for the row rather than once per dot. */}
      <View
        style={styles.dots}
        accessibilityRole="text"
        accessibilityLabel={`Plot ${current + 1} of ${plots.length}.`}
      >
        {plots.map((plot, index) => (
          <View key={plot.id} style={[styles.dot, index === current ? styles.dotActive : null]} />
        ))}
      </View>
    </View>
  );
});

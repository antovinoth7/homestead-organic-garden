import React, { useEffect, useMemo } from 'react';
import { View, Animated, useWindowDimensions } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/managePlantCatalogStyles';

interface Props {
  /** How many placeholder rows to draw — roughly one screenful. */
  count?: number;
}

/**
 * Placeholder rows shown while the catalog loads.
 *
 * Replaces a full-screen spinner, which blanked the list on every cold start
 * and told the user nothing about what was coming. These occupy the real row
 * metrics, so the list does not jump when the data lands.
 *
 * Plain `Animated` rather than a shimmer sweep: the app has no reanimated, and
 * a pulsing opacity reads as loading without a gradient to maintain.
 */
function CatalogSkeletonRowsComponent({ count = 8 }: Props): React.JSX.Element {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, fontScale), [theme, fontScale]);

  const pulse = useAnimatedValue(0.4);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const rows = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);

  return (
    <View
      style={styles.listContent}
      accessibilityLabel="Loading catalog"
      accessibilityRole="progressbar"
    >
      <View style={styles.skeletonHeader} />
      {rows.map((index) => (
        <View
          key={index}
          style={[
            styles.listCard,
            index === 0 && styles.listCardFirst,
            index === rows.length - 1 && styles.listCardLast,
          ]}
        >
          <View style={styles.plantRowCompact}>
            <Animated.View style={[styles.skeletonThumb, { opacity: pulse }]} />
            <View style={styles.plantInfo}>
              <Animated.View style={[styles.skeletonLineWide, { opacity: pulse }]} />
              <Animated.View style={[styles.skeletonLineNarrow, { opacity: pulse }]} />
            </View>
          </View>
          {index !== rows.length - 1 && <View style={styles.rowDivider} />}
        </View>
      ))}
    </View>
  );
}

export const CatalogSkeletonRows = React.memo(CatalogSkeletonRowsComponent);

import { useEffect } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

const PULSE_LOW = 0.4;
const PULSE_HIGH = 1;
/** Opacity held when the user has asked the OS to reduce motion. */
const PULSE_STILL = 0.7;
const PULSE_HALF_CYCLE_MS = 700;

/**
 * The opacity that drives every skeleton placeholder: a slow 0.4 ↔ 1 loop.
 *
 * Plain `Animated` rather than a shimmer sweep: the app has no reanimated, and
 * a pulsing opacity reads as loading without a gradient to maintain. With
 * Reduce Motion on, the value is held still instead of looping.
 *
 * No React state is touched — the reduce-motion answer only decides whether to
 * start the loop — so this costs no re-render once mounted.
 *
 * `enabled: false` creates the value but never animates it; a nested
 * `Skeleton` passes that and borrows its parent's pulse instead.
 */
export function useSkeletonPulse(enabled = true): Animated.Value {
  const pulse = useAnimatedValue(PULSE_LOW);

  useEffect(() => {
    if (!enabled) return undefined;
    let cancelled = false;
    let loop: Animated.CompositeAnimation | null = null;

    void AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduceMotion) => {
        if (cancelled) return;
        if (reduceMotion) {
          pulse.setValue(PULSE_STILL);
          return;
        }
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: PULSE_HIGH,
              duration: PULSE_HALF_CYCLE_MS,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: PULSE_LOW,
              duration: PULSE_HALF_CYCLE_MS,
              useNativeDriver: true,
            }),
          ])
        );
        loop.start();
      });

    return () => {
      cancelled = true;
      loop?.stop();
    };
  }, [enabled, pulse]);

  return pulse;
}

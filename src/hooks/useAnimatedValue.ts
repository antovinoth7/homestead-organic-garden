import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Cross-platform replacements for React Native 0.86's `useAnimatedValue` /
 * `useAnimatedValueXY`.
 *
 * react-native-web (0.21.x) exports `Animated` but *not* these two hooks, so
 * importing them from 'react-native' type-checks and passes tests yet crashes
 * the web bundle with "useAnimatedValue is not a function".
 *
 * Implemented with a `useState` lazy initializer rather than RN's
 * `useRef(...).current`: the semantics are identical — created once, stable for
 * the lifetime of the component, later `initialValue` changes ignored — but it
 * does not read a ref during render, which `react-hooks/refs` reports as an
 * error.
 */
export function useAnimatedValue(
  initialValue: number,
  config?: Animated.AnimatedConfig | null
): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue, config));
  return value;
}

export function useAnimatedValueXY(
  initialValue: { x: number; y: number },
  config?: Animated.AnimatedConfig | null
): Animated.ValueXY {
  const [value] = useState(() => new Animated.ValueXY(initialValue, config));
  return value;
}

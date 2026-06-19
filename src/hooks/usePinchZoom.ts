import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { State } from 'react-native-gesture-handler';
import type {
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
  HandlerStateChangeEvent,
} from 'react-native-gesture-handler';

export interface PinchZoom {
  composedScale: ReturnType<typeof Animated.multiply>;
  translateX: Animated.Value;
  translateY: Animated.Value;
  pinchHandlerRef: React.MutableRefObject<null>;
  panHandlerRef: React.MutableRefObject<null>;
  onPinchEvent: (...args: unknown[]) => void;
  onPinchStateChange: (e: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => void;
  onPanEvent: (...args: unknown[]) => void;
  onPanStateChange: (e: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => void;
  onDoubleTap: (e: HandlerStateChangeEvent<TapGestureHandlerEventPayload>) => void;
}

/**
 * Pinch-to-zoom + pan + double-tap gesture engine for a fullscreen image.
 * Expo Go compatible — uses the legacy Animated API (no reanimated).
 * Resets transform state whenever `active` becomes true.
 */
export function usePinchZoom(active: boolean): PinchZoom {
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const composedScale = useRef(Animated.multiply(baseScale, pinchScale)).current;
  const lastScale = useRef(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const pinchHandlerRef = useRef(null);
  const panHandlerRef = useRef(null);

  const resetZoomValues = useCallback(() => {
    baseScale.setValue(1);
    pinchScale.setValue(1);
    translateX.setOffset(0);
    translateX.setValue(0);
    translateY.setOffset(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastOffset.current = { x: 0, y: 0 };
  }, [baseScale, pinchScale, translateX, translateY]);

  useEffect(() => {
    if (active) resetZoomValues();
  }, [active, resetZoomValues]);

  const onPinchEvent = useRef(
    Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true })
  ).current;

  const onPinchStateChange = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => {
      if (nativeEvent.oldState === State.ACTIVE) {
        lastScale.current = Math.min(4, Math.max(1, lastScale.current * nativeEvent.scale));
        baseScale.setValue(lastScale.current);
        pinchScale.setValue(1);
      }
    },
    [baseScale, pinchScale]
  );

  const onPanEvent = useRef(
    Animated.event([{ nativeEvent: { translationX: translateX, translationY: translateY } }], {
      useNativeDriver: true,
    })
  ).current;

  const onPanStateChange = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (nativeEvent.oldState === State.ACTIVE) {
        lastOffset.current.x += nativeEvent.translationX;
        lastOffset.current.y += nativeEvent.translationY;
        translateX.setOffset(lastOffset.current.x);
        translateX.setValue(0);
        translateY.setOffset(lastOffset.current.y);
        translateY.setValue(0);
      }
    },
    [translateX, translateY]
  );

  const onDoubleTap = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<TapGestureHandlerEventPayload>) => {
      if (nativeEvent.state === State.ACTIVE) {
        if (lastScale.current > 1) {
          // Collapse offset into value so spring animates to true 0
          translateX.setOffset(0);
          translateX.setValue(lastOffset.current.x);
          translateY.setOffset(0);
          translateY.setValue(lastOffset.current.y);
          Animated.parallel([
            Animated.spring(baseScale, { toValue: 1, useNativeDriver: true }),
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
          ]).start(() => {
            lastScale.current = 1;
            lastOffset.current = { x: 0, y: 0 };
          });
        } else {
          Animated.spring(baseScale, { toValue: 2, useNativeDriver: true }).start();
          lastScale.current = 2;
        }
      }
    },
    [baseScale, translateX, translateY]
  );

  return {
    composedScale,
    translateX,
    translateY,
    pinchHandlerRef,
    panHandlerRef,
    onPinchEvent,
    onPinchStateChange,
    onPanEvent,
    onPanStateChange,
    onDoubleTap,
  };
}

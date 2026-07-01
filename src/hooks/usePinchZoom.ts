import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';
import { State } from 'react-native-gesture-handler';
import type {
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
  HandlerStateChangeEvent,
} from 'react-native-gesture-handler';

const SCREEN = Dimensions.get('window');
// Image is laid out at 80% of screen height in ImageZoomModal.
const IMAGE_HEIGHT = SCREEN.height * 0.8;
const MAX_SCALE = 4;

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

  // Max distance the image can be panned per axis at a given scale, so it can
  // never be dragged entirely off-screen.
  const panBounds = useCallback((scale: number): { x: number; y: number } => {
    const clamped = Math.max(1, scale);
    return {
      x: (SCREEN.width * (clamped - 1)) / 2,
      y: (IMAGE_HEIGHT * (clamped - 1)) / 2,
    };
  }, []);

  // Spring the image back to a centred, un-panned state at the given scale.
  const springToCenter = useCallback(
    (scale: number): void => {
      // Collapse any pan offset into the value so the spring lands on true 0.
      translateX.setOffset(0);
      translateX.setValue(lastOffset.current.x);
      translateY.setOffset(0);
      translateY.setValue(lastOffset.current.y);
      Animated.parallel([
        Animated.spring(baseScale, { toValue: scale, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      ]).start(() => {
        lastScale.current = scale;
        lastOffset.current = { x: 0, y: 0 };
      });
    },
    [baseScale, translateX, translateY]
  );

  const onPinchEvent = useRef(
    Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true })
  ).current;

  const onPinchStateChange = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => {
      if (nativeEvent.oldState === State.ACTIVE) {
        const next = Math.min(MAX_SCALE, Math.max(1, lastScale.current * nativeEvent.scale));
        pinchScale.setValue(1);
        if (next <= 1.01) {
          // Zoomed back out — snap to 1x and recentre so the image can't get
          // stuck zoomed/off-centre.
          springToCenter(1);
        } else {
          lastScale.current = next;
          baseScale.setValue(next);
          // Pull any existing pan back inside the new (smaller) bounds.
          const bounds = panBounds(next);
          lastOffset.current.x = Math.min(bounds.x, Math.max(-bounds.x, lastOffset.current.x));
          lastOffset.current.y = Math.min(bounds.y, Math.max(-bounds.y, lastOffset.current.y));
          translateX.setOffset(lastOffset.current.x);
          translateX.setValue(0);
          translateY.setOffset(lastOffset.current.y);
          translateY.setValue(0);
        }
      }
    },
    [baseScale, pinchScale, panBounds, springToCenter, translateX, translateY]
  );

  const onPanEvent = useRef(
    Animated.event([{ nativeEvent: { translationX: translateX, translationY: translateY } }], {
      useNativeDriver: true,
    })
  ).current;

  const onPanStateChange = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
      if (nativeEvent.oldState === State.ACTIVE) {
        const bounds = panBounds(lastScale.current);
        lastOffset.current.x = Math.min(
          bounds.x,
          Math.max(-bounds.x, lastOffset.current.x + nativeEvent.translationX)
        );
        lastOffset.current.y = Math.min(
          bounds.y,
          Math.max(-bounds.y, lastOffset.current.y + nativeEvent.translationY)
        );
        translateX.setOffset(lastOffset.current.x);
        translateX.setValue(0);
        translateY.setOffset(lastOffset.current.y);
        translateY.setValue(0);
      }
    },
    [panBounds, translateX, translateY]
  );

  const onDoubleTap = useCallback(
    ({ nativeEvent }: HandlerStateChangeEvent<TapGestureHandlerEventPayload>) => {
      if (nativeEvent.state === State.ACTIVE) {
        if (lastScale.current > 1) {
          springToCenter(1);
        } else {
          Animated.spring(baseScale, { toValue: 2, useNativeDriver: true }).start();
          lastScale.current = 2;
        }
      }
    },
    [baseScale, springToCenter]
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

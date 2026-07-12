import React, { useEffect, useMemo } from 'react';
import type { ImageStyle } from 'react-native';
import { Animated } from 'react-native';
import {
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/imageZoomModalStyles';
import { usePinchZoom } from '@/hooks/usePinchZoom';

interface Props {
  uri: string;
  /** True when this is the page the pager is currently showing. Resets zoom on change. */
  active: boolean;
  onZoomChange: (zoomed: boolean) => void;
}

/**
 * A single pinch/pan/double-tap zoomable page of {@link ImageZoomModal}'s pager.
 * Split out of the modal because each page needs its own `usePinchZoom` instance
 * and hooks cannot be called in a loop.
 */
export function ZoomableImagePage({ uri, active, onZoomChange }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const zoom = usePinchZoom(active);

  useEffect(() => {
    if (active) onZoomChange(zoom.isZoomed);
  }, [active, zoom.isZoomed, onZoomChange]);

  return (
    <TapGestureHandler numberOfTaps={2} onHandlerStateChange={zoom.onDoubleTap}>
      <Animated.View style={styles.page}>
        <PanGestureHandler
          ref={zoom.panHandlerRef}
          // Only claim the drag once zoomed in — otherwise the horizontal pager
          // owns it, so there is no gesture arbitration between the two.
          enabled={zoom.isZoomed}
          onGestureEvent={zoom.onPanEvent}
          onHandlerStateChange={zoom.onPanStateChange}
          simultaneousHandlers={[zoom.pinchHandlerRef]}
          minPointers={1}
          maxPointers={2}
        >
          <Animated.View style={styles.imageBox}>
            <PinchGestureHandler
              ref={zoom.pinchHandlerRef}
              onGestureEvent={zoom.onPinchEvent}
              onHandlerStateChange={zoom.onPinchStateChange}
              simultaneousHandlers={[zoom.panHandlerRef]}
            >
              <Animated.View
                style={[
                  styles.imageBox,
                  {
                    transform: [
                      { translateX: zoom.translateX },
                      { translateY: zoom.translateY },
                      { scale: zoom.composedScale },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri }}
                  style={styles.image as ImageStyle}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              </Animated.View>
            </PinchGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </TapGestureHandler>
  );
}

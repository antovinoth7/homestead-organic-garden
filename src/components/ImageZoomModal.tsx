import React from 'react';
import { View, Modal, StatusBar, TouchableOpacity, Dimensions, Animated } from 'react-native';
import {
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { EdgeInsets } from 'react-native-safe-area-context';
import type { createStyles } from '@/styles/plantDetailStyles';
import { usePinchZoom } from '@/hooks/usePinchZoom';

type DetailStyles = ReturnType<typeof createStyles>;

const SCREEN = Dimensions.get('window');

interface Props {
  visible: boolean;
  uri: string;
  insets: EdgeInsets;
  styles: DetailStyles;
  onClose: () => void;
}

/** Fullscreen image viewer with pinch/pan/double-tap zoom. */
export function ImageZoomModal({ visible, uri, insets, styles, onClose }: Props): React.JSX.Element {
  const zoom = usePinchZoom(visible);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={[styles.zoomClose, { top: insets.top + 16 }]} onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TapGestureHandler numberOfTaps={2} onHandlerStateChange={zoom.onDoubleTap}>
            <Animated.View style={styles.zoomGestureContainer}>
              <PanGestureHandler
                ref={zoom.panHandlerRef}
                onGestureEvent={zoom.onPanEvent}
                onHandlerStateChange={zoom.onPanStateChange}
                simultaneousHandlers={[zoom.pinchHandlerRef]}
                minPointers={1}
                maxPointers={2}
              >
                <Animated.View style={styles.zoomGestureContainer}>
                  <PinchGestureHandler
                    ref={zoom.pinchHandlerRef}
                    onGestureEvent={zoom.onPinchEvent}
                    onHandlerStateChange={zoom.onPinchStateChange}
                    simultaneousHandlers={[zoom.panHandlerRef]}
                  >
                    <Animated.View
                      style={[
                        styles.zoomGestureContainer,
                        {
                          width: SCREEN.width,
                          height: SCREEN.height * 0.8,
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
                        style={{ width: SCREEN.width, height: SCREEN.height * 0.8 }}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                      />
                    </Animated.View>
                  </PinchGestureHandler>
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

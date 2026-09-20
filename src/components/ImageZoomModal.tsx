import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { View, Text, Modal, StatusBar, TouchableOpacity } from 'react-native';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import type { ImageSource } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { createStyles, PAGE_WIDTH } from '@/styles/imageZoomModalStyles';
import { ZoomableImagePage } from '@/components/ZoomableImagePage';

interface Props {
  visible: boolean;
  /**
   * Photos to page through — file URIs or bundled `require()` assets.
   * Single-photo callers pass a one-element array.
   */
  sources: (string | ImageSource)[];
  /** Photo to open on. Defaults to the first. */
  initialIndex?: number;
  onClose: () => void;
}

/** Fullscreen swipeable photo viewer with pinch/pan/double-tap zoom per page. */
export function ImageZoomModal({
  visible,
  sources,
  initialIndex = 0,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const startIndex = Math.min(Math.max(initialIndex, 0), Math.max(sources.length - 1, 0));
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  // The active page reports its zoom state up so the pager can yield the drag.
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(startIndex);
      setZoomed(false);
    }
  }, [visible, startIndex]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
      const next = Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH);
      if (next !== currentIndex) setCurrentIndex(next);
    },
    [currentIndex]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<string | ImageSource>): React.JSX.Element => (
      <ZoomableImagePage source={item} active={index === currentIndex} onZoomChange={setZoomed} />
    ),
    [currentIndex]
  );

  const keyExtractor = useCallback(
    (item: string | ImageSource, index: number): string =>
      typeof item === 'string' ? `${index}-${item}` : `${index}-asset`,
    []
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<string | ImageSource> | null | undefined, index: number) => ({
      length: PAGE_WIDTH,
      offset: PAGE_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.shadow} />
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.zoomOverlay}>
          <TouchableOpacity
            style={[styles.zoomClose, { top: insets.top + 16 }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close photo"
          >
            <Ionicons name="close" size={28} color={theme.textInverse} />
          </TouchableOpacity>

          {sources.length > 1 && (
            <View style={[styles.counter, { top: insets.top + 24 }]}>
              <Text style={styles.counterText}>{`${currentIndex + 1} / ${sources.length}`}</Text>
            </View>
          )}

          <FlatList
            data={sources}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemLayout={getItemLayout}
            initialScrollIndex={startIndex}
            horizontal
            pagingEnabled
            // While a page is zoomed in its PanGestureHandler owns the drag, so
            // the pager must stop competing for it.
            scrollEnabled={!zoomed}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            style={styles.pager}
            windowSize={3}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

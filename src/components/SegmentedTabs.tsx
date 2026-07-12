import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/segmentedTabsStyles';
import { scrollIntoViewOffset } from '@/utils/scrollSpy';
import type { ItemExtent } from '@/utils/scrollSpy';

export interface SegmentedTab<K extends string> {
  key: K;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}

interface Props<K extends string> {
  tabs: readonly SegmentedTab<K>[];
  activeKey: K;
  onChange: (key: K) => void;
}

/**
 * Generic horizontally-scrollable segmented pill control. Decoupled from any
 * specific data source — callers supply the tab list and own the active state.
 *
 * When the active key changes the bar scrolls the matching pill into view, so
 * tabs that overflow the screen stay reachable and the scroll-spy's current tab
 * is never left off-screen.
 */
export function SegmentedTabs<K extends string>({
  tabs,
  activeKey,
  onChange,
}: Props<K>): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const scrollRef = useRef<ScrollView | null>(null);
  const pillExtents = useRef<Map<K, ItemExtent>>(new Map());
  const scrollX = useRef(0);
  const contentWidth = useRef(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  const registerPill = useCallback(
    (key: K) => (event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      pillExtents.current.set(key, { x, width });
    },
    []
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.current = event.nativeEvent.contentOffset.x;
  }, []);

  const onContentSizeChange = useCallback((width: number) => {
    contentWidth.current = width;
  }, []);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setViewportWidth(event.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    const extent = pillExtents.current.get(activeKey);
    if (!extent || !scrollRef.current) return;

    const target = scrollIntoViewOffset(
      extent,
      scrollX.current,
      viewportWidth,
      contentWidth.current
    );
    if (Math.abs(target - scrollX.current) < 1) return;

    scrollRef.current.scrollTo({ x: target, animated: true });
  }, [activeKey, viewportWidth]);

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onLayout={onLayout}
        onScroll={onScroll}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={16}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onChange(tab.key)}
              onLayout={registerPill(tab.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              {tab.icon && (
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? theme.primary : theme.textSecondary}
                />
              )}
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

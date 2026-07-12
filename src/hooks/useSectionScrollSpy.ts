import { useCallback, useRef, useState } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { activeSectionKey } from '@/utils/scrollSpy';
import type { SectionOffset } from '@/utils/scrollSpy';

/** Slack (px) when comparing scroll position against the content end. */
const END_EPSILON = 2;

interface SectionScrollSpy<K extends string> {
  activeKey: K;
  scrollRef: React.RefObject<ScrollView | null>;
  registerSection: (key: K) => (event: LayoutChangeEvent) => void;
  onTabBarLayout: (event: LayoutChangeEvent) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollEnd: () => void;
  scrollToKey: (key: K) => void;
}

/**
 * Drives a one-page, sticky-tab layout: sections register their measured top
 * offset, scrolling highlights the section currently under the sticky bar
 * (scroll-spy), and selecting a key scrolls that section just under the bar.
 * A short guard stops the spy from fighting a programmatic scroll.
 */
export function useSectionScrollSpy<K extends string>(keys: readonly K[]): SectionScrollSpy<K> {
  const scrollRef = useRef<ScrollView | null>(null);
  const offsetsRef = useRef<Map<K, number>>(new Map());
  const programmaticRef = useRef(false);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeKey, setActiveKey] = useState<K>(keys[0] as K);
  const [tabBarHeight, setTabBarHeight] = useState(0);

  const registerSection = useCallback(
    (key: K) => (event: LayoutChangeEvent) => {
      offsetsRef.current.set(key, event.nativeEvent.layout.y);
    },
    []
  );

  const onTabBarLayout = useCallback((event: LayoutChangeEvent) => {
    setTabBarHeight(event.nativeEvent.layout.height);
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (programmaticRef.current) return;
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const offsets: SectionOffset<K>[] = keys
        .map((key) => ({ key, y: offsetsRef.current.get(key) }))
        .filter((o): o is SectionOffset<K> => o.y !== undefined);
      const atEnd =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - END_EPSILON;
      const next = activeSectionKey(offsets, contentOffset.y, tabBarHeight, atEnd);
      if (next && next !== activeKey) setActiveKey(next);
    },
    [keys, activeKey, tabBarHeight]
  );

  const onMomentumScrollEnd = useCallback(() => {
    programmaticRef.current = false;
  }, []);

  const scrollToKey = useCallback(
    (key: K) => {
      const y = offsetsRef.current.get(key);
      if (y === undefined || !scrollRef.current) return;
      programmaticRef.current = true;
      setActiveKey(key);
      scrollRef.current.scrollTo({ y: Math.max(0, y - tabBarHeight), animated: true });
      if (programmaticTimer.current) clearTimeout(programmaticTimer.current);
      // Fallback in case momentum-end doesn't fire (e.g. very short scrolls).
      programmaticTimer.current = setTimeout(() => {
        programmaticRef.current = false;
      }, 450);
    },
    [tabBarHeight]
  );

  return {
    activeKey,
    scrollRef,
    registerSection,
    onTabBarLayout,
    onScroll,
    onMomentumScrollEnd,
    scrollToKey,
  };
}

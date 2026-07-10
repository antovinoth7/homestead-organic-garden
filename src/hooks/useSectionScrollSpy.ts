import { useCallback, useRef, useState } from 'react';
import type {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native';
import { activeSectionKey } from '@/utils/scrollSpy';
import type { SectionOffset } from '@/utils/scrollSpy';

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
  const tabBarHeightRef = useRef(0);
  const programmaticRef = useRef(false);
  const programmaticTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeKey, setActiveKey] = useState<K>(keys[0] as K);

  const registerSection = useCallback(
    (key: K) => (event: LayoutChangeEvent) => {
      offsetsRef.current.set(key, event.nativeEvent.layout.y);
    },
    []
  );

  const onTabBarLayout = useCallback((event: LayoutChangeEvent) => {
    tabBarHeightRef.current = event.nativeEvent.layout.height;
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (programmaticRef.current) return;
      const offsets: SectionOffset<K>[] = keys
        .map((key) => ({ key, y: offsetsRef.current.get(key) }))
        .filter((o): o is SectionOffset<K> => o.y !== undefined);
      const next = activeSectionKey(offsets, event.nativeEvent.contentOffset.y, tabBarHeightRef.current);
      if (next && next !== activeKey) setActiveKey(next);
    },
    [keys, activeKey]
  );

  const onMomentumScrollEnd = useCallback(() => {
    programmaticRef.current = false;
  }, []);

  const scrollToKey = useCallback((key: K) => {
    const y = offsetsRef.current.get(key);
    if (y === undefined || !scrollRef.current) return;
    programmaticRef.current = true;
    setActiveKey(key);
    scrollRef.current.scrollTo({ y: Math.max(0, y - tabBarHeightRef.current), animated: true });
    if (programmaticTimer.current) clearTimeout(programmaticTimer.current);
    // Fallback in case momentum-end doesn't fire (e.g. very short scrolls).
    programmaticTimer.current = setTimeout(() => {
      programmaticRef.current = false;
    }, 450);
  }, []);

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

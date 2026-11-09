import React, { createContext, useContext } from 'react';
import { View, type Animated, type StyleProp, type ViewStyle } from 'react-native';
import { useSkeletonPulse } from '@/hooks/useSkeletonPulse';

interface Props {
  /** What is loading, read by screen readers, e.g. "Loading plants". */
  label: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const SkeletonPulseContext = createContext<Animated.Value | null>(null);

/** The pulse of the nearest `Skeleton`, or `null` outside one. */
export function useSkeletonPulseContext(): Animated.Value | null {
  return useContext(SkeletonPulseContext);
}

/**
 * Container for loading placeholders: owns the pulse every `SkeletonBlock`
 * inside it shares, and announces itself as a progress bar.
 *
 * Shown in place of a full-screen spinner wherever content is loading, so the
 * screen keeps its shape and says what is coming. A `Skeleton` nested in
 * another (a ready-made layout inside a composed screen skeleton) borrows the
 * outer pulse and stays silent, so a screen runs one loop and announces once.
 *
 * Spinners (`ActivityIndicator`) are for an action in progress — a button, a
 * save overlay — not for content loading.
 */
function SkeletonComponent({ label, style, children }: Readonly<Props>): React.JSX.Element {
  const parent = useContext(SkeletonPulseContext);
  const own = useSkeletonPulse(parent === null);

  if (parent !== null) {
    return <View style={style}>{children}</View>;
  }

  return (
    <SkeletonPulseContext.Provider value={own}>
      <View style={style} accessibilityRole="progressbar" accessibilityLabel={label}>
        {children}
      </View>
    </SkeletonPulseContext.Provider>
  );
}

export const Skeleton = React.memo(SkeletonComponent);

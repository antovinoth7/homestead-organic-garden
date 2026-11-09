import React, { useMemo } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/skeletonStyles';
import { useSkeletonPulseContext } from './Skeleton';

interface Props {
  /** Size, radius and spacing — from the caller's styles file. */
  style?: StyleProp<ViewStyle>;
  /** `soft` draws a lighter block, for secondary lines. */
  tone?: 'block' | 'soft';
}

/**
 * One placeholder shape. Pulses with the enclosing `Skeleton`; outside one it
 * is drawn still.
 */
function SkeletonBlockComponent({ style, tone = 'block' }: Readonly<Props>): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pulse = useSkeletonPulseContext();

  const pulseStyle = useMemo(() => (pulse ? { opacity: pulse } : null), [pulse]);

  return (
    <Animated.View
      style={[styles.block, tone === 'soft' && styles.soft, style, pulseStyle]}
      importantForAccessibility="no-hide-descendants"
    />
  );
}

export const SkeletonBlock = React.memo(SkeletonBlockComponent);

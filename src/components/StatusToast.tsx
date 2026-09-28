import React, { useEffect, useMemo } from 'react';
import { Animated, Platform, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { createStyles } from '@/styles/statusToastStyles';

interface Props {
  /** Text to show; null hides the toast. A new message restarts the timer. */
  message: string | null;
  /** Called once the toast has faded out, so the parent can clear `message`. */
  onHide: () => void;
  /** Distance from the bottom of the screen, in px. */
  bottomOffset: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

const VISIBLE_MS = 3200;
const FADE_MS = 180;
const useNativeDriver = Platform.OS !== 'web';

/**
 * Brief confirmation after an action ("Harvest saved: 120 pcs") with nothing to
 * undo — `UndoToast` covers the undoable case. Fades in, holds, fades out, then
 * hands control back through `onHide`.
 */
export function StatusToast({
  message,
  onHide,
  bottomOffset,
  icon = 'checkmark',
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    if (!message) return undefined;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver }).start(
        ({ finished }) => {
          if (finished) onHide();
        }
      );
    }, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [message, opacity, onHide]);

  if (!message) return null;

  return (
    <Animated.View
      style={[styles.toast, { bottom: bottomOffset, opacity }]}
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <Ionicons name={icon} size={20} color={theme.heroRingFill} />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

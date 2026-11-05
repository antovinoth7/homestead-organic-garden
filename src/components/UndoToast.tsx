import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/undoToastStyles';

interface Props {
  visible: boolean;
  message: string;
  onUndo: () => void;
  /**
   * 0→1 value driving the countdown bar; parent owns the timing animation and
   * should run it with `useNativeDriver: true`.
   */
  progress: Animated.Value;
  /** Distance from the bottom of the screen, in px. */
  bottomOffset: number;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
}

/**
 * Floating "X done — Undo" toast with a draining progress bar. Presentational:
 * the parent owns the `progress` Animated.Value, the auto-dismiss timer, and the
 * `onUndo` handler. Shared by the plant list (delete, saved), the bed list
 * (delete) and the Care Plan (ticks).
 *
 * The bar drains by `scaleX` from its left edge rather than by `width`, so the
 * parent can drive `progress` with `useNativeDriver: true`: a 4–5 s JS-driven
 * width animation re-laid-out the bar every frame on the JS thread, exactly
 * while the list underneath was refreshing.
 */
export function UndoToast({
  visible,
  message,
  onUndo,
  progress,
  bottomOffset,
  icon = 'trash-outline',
  actionLabel = 'Undo',
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const barTransform = useMemo(() => ({ transform: [{ scaleX: progress }] }), [progress]);

  if (!visible) return null;

  return (
    <View style={[styles.toast, { bottom: bottomOffset }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Ionicons name={icon} size={16} color={theme.textSecondary} />
          <Text style={styles.text}>{message}</Text>
        </View>
        <TouchableOpacity
          onPress={onUndo}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, barTransform]} />
      </View>
    </View>
  );
}

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/undoToastStyles';

interface Props {
  visible: boolean;
  message: string;
  onUndo: () => void;
  /** 0→1 value driving the countdown bar; parent owns the timing animation. */
  progress: Animated.Value;
  /** Distance from the bottom of the screen, in px. */
  bottomOffset: number;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
}

/**
 * Floating "X done — Undo" toast with a draining progress bar. Presentational:
 * the parent owns the `progress` Animated.Value, the auto-dismiss timer, and the
 * `onUndo` handler. Shared by the bed list (delete) and bed detail (soil log).
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

  if (!visible) return null;

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>
    </View>
  );
}

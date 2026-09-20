import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/theme';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { createStyles } from '@/styles/bottomSheetModalStyles';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** The sheet's own card style — rounded corners, runtime maxHeight, paddingBottom. */
  sheetStyle?: StyleProp<ViewStyle>;
  /** Lift the sheet above the software keyboard (forms with text inputs). */
  keyboardAvoiding?: boolean;
  /** false blocks backdrop dismissal (e.g. while a save is in flight). */
  dismissOnBackdropPress?: boolean;
}

/** How far the sheet rises into place, in px. */
const RISE_DISTANCE = 24;
const RISE_DURATION = 180;

const useNativeDriver = Platform.OS !== 'web';

/**
 * Shared chrome for every bottom sheet: full-screen dim, tap-outside to close,
 * and a short rise on open.
 *
 * The modal fades rather than slides on purpose. `animationType="slide"` moves
 * the whole window — dim included — so the backdrop sweeps up as a curtain
 * instead of dimming in place, which reads as a flicker. Fading the window and
 * animating only the sheet keeps the dim steady. Fade-out also covers dismissal,
 * so there's no close animation to sequence against `visible`.
 */
export function BottomSheetModal({
  visible,
  onClose,
  children,
  sheetStyle,
  keyboardAvoiding = false,
  dismissOnBackdropPress = true,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const translateY = useRef(new Animated.Value(RISE_DISTANCE)).current;
  const keyboardHeight = useKeyboardHeight();

  // Park the sheet back down once closed so the next open rises again.
  useEffect(() => {
    if (!visible) translateY.setValue(RISE_DISTANCE);
  }, [visible, translateY]);

  // Started from onShow — i.e. after the window is presented — so the rise
  // isn't spent on frames the user can't see yet.
  const runRise = useCallback((): void => {
    Animated.timing(translateY, {
      toValue: 0,
      duration: RISE_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver,
    }).start();
  }, [translateY]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={runRise}
      statusBarTranslucent
      navigationBarTranslucent
      hardwareAccelerated
    >
      {/* Padding the flex root — rather than wrapping the sheet in a
          KeyboardAvoidingView — keeps the sheet bottom-anchored and shrinks the
          content box the sheet's percentage maxHeight resolves against. */}
      <View style={[styles.root, keyboardAvoiding && { paddingBottom: keyboardHeight }]}>
        {/* Sibling, not a wrapper: taps on the sheet never reach it, so the
            sheet needs no tap-swallowing layer of its own. */}
        {dismissOnBackdropPress && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        )}
        <Animated.View style={[styles.sheet, sheetStyle, { transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

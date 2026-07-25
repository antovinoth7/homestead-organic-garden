import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import type { KeyboardEvent } from 'react-native';

/**
 * Tracks the software keyboard's height in px (0 when hidden).
 *
 * Exists because `KeyboardAvoidingView` mis-measures inside a transparent,
 * `statusBarTranslucent` RN `Modal` — the modal window isn't resized by
 * `adjustResize` on Android, so the view shrink-wraps its child and computes a
 * bogus offset. Padding a container by the measured height is deterministic.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e: KeyboardEvent) =>
      setHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}

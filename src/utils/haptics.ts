import { Vibration, Platform } from 'react-native';
import { logger } from '@/utils/logger';

/**
 * Lightweight tactile feedback for confirmations (e.g. logging a soil input).
 *
 * Uses React Native's built-in `Vibration` API so it needs no extra dependency.
 * When `expo-haptics` becomes installable, swap the body here for
 * `Haptics.impactAsync(...)` — every caller goes through this single helper.
 */
export function tapFeedback(): void {
  try {
    // A short pulse reads as a tap. iOS ignores the duration argument (fixed
    // ~400ms system buzz), so keep it brief and best-effort on both platforms.
    Vibration.vibrate(Platform.OS === 'android' ? 15 : 1);
  } catch (err) {
    logger.warn('tapFeedback failed', err as Error);
  }
}

import NetInfo from '@react-native-community/netinfo';
import { logger } from './logger';

/**
 * Network State Monitoring Utility
 * Tracks online/offline status to avoid hanging operations.
 */

let isOnline = true;
let unsubscribe: (() => void) | null = null;

type NetworkChangeListener = (online: boolean) => void;

const changeListeners = new Set<NetworkChangeListener>();

/**
 * Subscribe to online/offline transitions. The listener fires only when the
 * state actually flips (and immediately with the current state on subscribe).
 * Returns an unsubscribe function.
 */
export const subscribeToNetworkChanges = (listener: NetworkChangeListener): (() => void) => {
  changeListeners.add(listener);
  listener(isOnline);
  return () => {
    changeListeners.delete(listener);
  };
};

const notifyChangeListeners = (online: boolean): void => {
  changeListeners.forEach((listener) => {
    try {
      listener(online);
    } catch (e) {
      logger.warn('Network change listener failed', e as Error);
    }
  });
};

/**
 * Initialize network state monitoring
 * Safe to call multiple times - will only subscribe once
 */
const initNetworkMonitoring = (): void => {
  if (unsubscribe) return; // Already initialized

  // Initialize network state monitoring
  NetInfo.fetch().then((state) => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? true;
    if (wasOnline !== isOnline) notifyChangeListeners(isOnline);
  });

  // Subscribe to network state changes
  unsubscribe = NetInfo.addEventListener((state) => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? true;

    if (wasOnline !== isOnline) {
      logger.debug(`Network state changed: ${isOnline ? 'online' : 'offline'}`);
      notifyChangeListeners(isOnline);
    }
  });
};

/**
 * Cleanup network monitoring listener
 * Call this when app is unmounting or no longer needs monitoring
 */
export const cleanupNetworkMonitoring = (): void => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    logger.debug('Network monitoring cleaned up');
  }
};

// Auto-initialize on module load
initNetworkMonitoring();

export const isNetworkAvailable = (): boolean => isOnline;

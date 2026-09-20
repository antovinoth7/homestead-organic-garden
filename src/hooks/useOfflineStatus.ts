import { useEffect, useState } from 'react';
import { subscribeToNetworkChanges } from '@/utils/networkState';
import { subscribeQueueCount } from '@/lib/offlineQueue';

export interface OfflineStatus {
  /** Current connectivity, per NetInfo */
  isOnline: boolean;
  /** Number of writes queued locally awaiting sync */
  pendingCount: number;
}

/**
 * Live connectivity + pending-offline-writes state for the offline banner.
 * Both subscriptions push their current value immediately on mount.
 */
export const useOfflineStatus = (): OfflineStatus => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribeNetwork = subscribeToNetworkChanges(setIsOnline);
    const unsubscribeQueue = subscribeQueueCount(setPendingCount);
    return () => {
      unsubscribeNetwork();
      unsubscribeQueue();
    };
  }, []);

  return { isOnline, pendingCount };
};

import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getFarmConfig } from '@/services/farmCapacity';
import { logError } from '@/utils/errorLogging';

export interface UseOwnerNameResult {
  ownerName: string;
  loading: boolean;
}

/**
 * Display name from the farm config, refreshed on screen focus.
 * Lighter than useFarmCapacity — it skips the bed fetch and the capacity
 * metrics, which the account header has no use for.
 */
export function useOwnerName(): UseOwnerNameResult {
  const [ownerName, setOwnerName] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);

      getFarmConfig()
        .then((config) => {
          if (!cancelled) setOwnerName(config.owner_name?.trim() ?? '');
        })
        .catch((err) => {
          if (!cancelled) logError('network', 'useOwnerName: failed to load', err as Error);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [])
  );

  return { ownerName, loading };
}

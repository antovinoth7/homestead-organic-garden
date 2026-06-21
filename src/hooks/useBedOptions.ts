import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Bed } from '@/types/database.types';
import { getBeds } from '@/services/beds';
import { logError } from '@/utils/errorLogging';

interface UseBedOptionsResult {
  beds: Bed[];
  loading: boolean;
  error: string | null;
  refresh: (options?: { silent?: boolean }) => void;
}

/**
 * Lightweight bed list for selectors/dropdowns that only need id + name.
 * Unlike useBedData it does NOT fetch all plants or compute coverage, so it
 * avoids the getAllPlants() pagination + O(beds×plants) enrichment cost.
 */
export function useBedOptions(): UseBedOptionsResult {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    setError(null);
    try {
      const rawBeds = await getBeds();
      // Newest beds first — same order useBedData produced.
      const sorted = [...rawBeds].sort((a, b) =>
        (b.created_at ?? '').localeCompare(a.created_at ?? '')
      );
      setBeds(sorted);
    } catch (err) {
      logError('network', 'useBedOptions: failed to load beds', err as Error);
      setError('Failed to load beds');
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { beds, loading, error, refresh: load };
}

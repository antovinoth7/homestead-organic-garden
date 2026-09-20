import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getLocationConfig } from '@/services/locations';
import { getFarmConfig } from '@/services/farmCapacity';
import { resolveLandCents, DEFAULT_LAND_CENTS } from '@/utils/landCents';
import { logger } from '@/utils/logger';

export interface UseLandCentsResult {
  landCents: number;
  loading: boolean;
}

/**
 * Total farm size in cents, refreshed whenever the screen regains focus.
 * Resolution order (per-plot sizes, then the deprecated `FarmConfig` field,
 * then a default) lives in `resolveLandCents`.
 */
export function useLandCents(): UseLandCentsResult {
  const [landCents, setLandCents] = useState(DEFAULT_LAND_CENTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Both reads are cache-first, so the common case costs no Firestore reads.
      const [locationConfig, farmConfig] = await Promise.all([
        getLocationConfig(),
        getFarmConfig(),
      ]);
      setLandCents(resolveLandCents(locationConfig.parentLocationProfiles, farmConfig));
    } catch (error: unknown) {
      logger.warn('useLandCents: failed to resolve farm size', error as Error);
      setLandCents(DEFAULT_LAND_CENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return { landCents, loading };
}

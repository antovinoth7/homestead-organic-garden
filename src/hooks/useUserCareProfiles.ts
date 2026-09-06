import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { PlantCareProfiles } from '@/types/database.types';
import { getPlantProfiles, toPlantCareProfilesShape } from '@/services/plantProfiles';
import { logError } from '@/utils/errorLogging';

interface UseUserCareProfilesResult {
  careProfiles: Partial<PlantCareProfiles>;
  loading: boolean;
  error: string | null;
}

/**
 * The farmer's own catalog edits, in the shape the read-only detail sections
 * expect. Unlike usePlantFormData this loads nothing but the profiles — no
 * locations, no garden plants — because a detail screen only needs the
 * overrides to layer over the bundled defaults.
 *
 * An empty object is a valid result: every consumer falls back to the static
 * defaults when a plant has no override, so callers can render while loading.
 */
export function useUserCareProfiles(): UseUserCareProfilesResult {
  const [profiles, setProfiles] = useState<PlantCareProfiles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setProfiles(await getPlantProfiles());
    } catch (err) {
      logError('network', 'useUserCareProfiles: failed to load plant profiles', err as Error);
      setError('Failed to load your catalog edits');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const careProfiles = useMemo(
    () => (profiles ? toPlantCareProfilesShape(profiles) : {}),
    [profiles]
  );

  return { careProfiles, loading, error };
}

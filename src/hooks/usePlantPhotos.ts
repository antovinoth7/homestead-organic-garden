import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveLocalImageUri } from '@/lib/imageStorage';
import { collectPlantPhotos } from '@/utils/plantPhotos';
import type { PlantPhotoItem } from '@/utils/plantPhotos';
import type { Plant, JournalEntry } from '@/types/database.types';

interface UsePlantPhotosParams {
  plant: Plant | null;
  journalEntries: JournalEntry[];
}

interface PlantPhotosData {
  photos: PlantPhotoItem[];
  loading: boolean;
}

/**
 * Aggregates a plant's photos (plant, journal and pest/disease records) and
 * resolves any filename-only entries to displayable local URIs. No Firestore
 * reads — journal photos are already resolved and pest photos come from the
 * local image store.
 */
export function usePlantPhotos({ plant, journalEntries }: UsePlantPhotosParams): PlantPhotosData {
  const collected = useMemo(
    () => collectPlantPhotos(plant, journalEntries),
    [plant, journalEntries]
  );

  const [photos, setPhotos] = useState<PlantPhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const unresolved = collected.filter((p) => !p.uri && p.filename);
    if (unresolved.length === 0) {
      setPhotos(collected.filter((p) => p.uri));
      return;
    }

    setLoading(true);
    let cancelled = false;
    void (async () => {
      const resolved = new Map<string, string>();
      await Promise.all(
        unresolved.map(async (p) => {
          const uri = await resolveLocalImageUri(p.filename ?? null);
          if (uri) resolved.set(p.id, uri);
        })
      );
      if (cancelled || !isMountedRef.current) return;
      const next = collected
        .map((p) => (p.uri ? p : { ...p, uri: resolved.get(p.id) ?? null }))
        .filter((p): p is PlantPhotoItem & { uri: string } => Boolean(p.uri));
      setPhotos(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [collected]);

  return { photos, loading };
}

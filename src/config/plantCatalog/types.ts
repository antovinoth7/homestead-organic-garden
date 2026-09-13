import type { PlantType } from '@/types/database.types';

/**
 * One bundled catalog row, whole.
 *
 * The catalog used to be authored as four parallel maps per category —
 * `plants`, `varieties`, `tamilNames`, `descriptions` — each keyed by the
 * display name. Nothing tied them together, so a name typo in one map silently
 * dropped that field with no type error, and a plant's existence had to be
 * written in three places (the `plants` array, `PLANT_VARIETIES_BY_TYPE`, and
 * an override key). This is the single place a row is declared; the parallel
 * maps are derived from it in `derive.ts`.
 *
 * Leaf by construction: types only, so `scripts/reference/*` can import it
 * under `tsx` without dragging in `@/lib/firebase` or a Metro asset require.
 */
export interface PlantCatalogEntry {
  /** Display name, and the key every other catalog structure is keyed by. */
  name: string;
  plantType: PlantType;
  /** Data-only until the Phase G language toggle ships. */
  tamilName: string;
  /**
   * The one-line subtitle the browse and search lists show.
   *
   * NOT the care profile's `description`, which is a longer detail-screen
   * narrative: the two diverge on most rows and serve different surfaces.
   * Collapsing them would rewrite the list subtitles into paragraphs.
   */
  shortDescription: string;
  /** Omitted for rows that are grown as a single unnamed type. */
  varieties?: string[];
}

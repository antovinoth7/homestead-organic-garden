import type {
  CatalogGroup,
  CropFamily,
  PlantHabit,
  PlantTag,
  PlantType,
} from '@/types/database.types';

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
  /**
   * Rotation family. Required, so a new row cannot be added without one: this
   * used to be derived by scanning guild templates, and 101 of the 128 rows
   * answered null because no template happened to mention them.
   */
  cropFamily: CropFamily;
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

  /**
   * Which pill the plant browses under: what you harvest it for.
   *
   * Deliberately independent of `plantType`, which is the *care* model. The two
   * used to be the same field, which is why the catalog's pills mixed purpose
   * (vegetable, herb, flower) with growth habit (shrub) and a single species
   * (coconut_tree), and why `vegetable` held a third of the rows. Castor is the
   * clearest case of the split: `plantType: 'herb'` because that is how it is
   * cared for, `group: 'farm_support'` because it is grown to repel pests.
   */
  group: CatalogGroup;
  /**
   * Section within the group. Omitted only for a group that renders as one run
   * — `catalogTaxonomy.test.ts` checks the two agree.
   */
  subGroup?: string;
  /**
   * Growth habit. A row badge and a filter, never a pill: filing by habit is
   * what put Hibiscus next to Agathi and Pineapple under "fruit trees".
   */
  habit: PlantHabit;
  /**
   * Cross-cutting facts, many per row. These carry what one hierarchy cannot —
   * `keerai` on Drumstick, a tree whose leaves are greens; `coconut_intercrop`
   * on the rows in four different groups that make up a thoppu planting.
   */
  tags: readonly PlantTag[];
}

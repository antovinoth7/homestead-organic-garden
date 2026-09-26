# Schema Migrations

The app uses a client-side migration runner (`src/migrations/`) to evolve Firestore data safely.

## How It Works

- **Version tracking**: `schema_version: number` in `user_settings/{uid}`. Default `0` for legacy users.
- **Runner**: `runPendingMigrations(userId)` is called from `App.tsx` after auth, before first screen render.
- **Launch cost**: the runner caches the confirmed schema version per user in AsyncStorage (`@garden_schema_version_<uid>`); when the cached value is already `>= LATEST_SCHEMA_VERSION` it returns without any auth refresh or Firestore read. The cache is written only after the remote version is confirmed or migrated, so bumping `LATEST_SCHEMA_VERSION` naturally invalidates it.
- **Migration files**: `src/migrations/NNN_descriptive_name.ts`, each exports `{ version, name, run(userId) }`.
- **Registry**: Add new migrations to the `migrations` array in `src/migrations/index.ts` and bump `LATEST_SCHEMA_VERSION`.
- **Idempotent**: Every migration must check before mutating — safe to re-run.
- **Error handling**: Failures are logged to Sentry (`logError("storage", ...)`). The runner stops at the first failure; already-completed migrations are not re-run.

---

## Schema Change Checklist

1. Update `src/types/database.types.ts` with new/changed fields.
2. If the field is **required** or reshapes existing data → write a migration in `src/migrations/`.
3. If the field is **optional** → no migration needed; handle `undefined` via `?? fallback`.
4. If adding a **new collection** → no migration; created on first write.
5. Bump `LATEST_SCHEMA_VERSION` in `src/migrations/index.ts`.
6. Add a test for the migration in `src/__tests__/migrations/`.

## Testing migrations without Firestore

Migration modules import `@/lib/firebase`, which throws without `EXPO_PUBLIC_FIREBASE_*`
env values, and the project forbids mocking Firestore. Split the decision logic into a
Firebase-free module and test that directly — `005_repair_farm_config.ts` (Firestore I/O)
plus `farmConfigRepairLogic.ts` (`planFarmConfigRepair`, pure and unit-tested) is the
reference pattern, mirroring `src/utils/offlineQueueLogic.ts`.

## Migration history

| Version | File | Purpose |
| ---: | --- | --- |
| 1 | `001_backfill_district.ts` | Backfilled district/zone. **Wrote top-level `district`/`zone_id`, which no runtime code reads** — superseded by 005. Left as-issued. |
| 2 | `002_seed_catalog_enrichment.ts` | Normalized catalog enrichment data. |
| 3 | `003_consolidate_plant_profiles.ts` | Consolidated per-plant profiles into one document. |
| 4 | `004_backfill_lifecycle_type.ts` | Set `lifecycle_type` on plants missing it. |
| 5 | `005_repair_farm_config.ts` | Copies 001's stranded top-level `district`/`zone_id` into the nested `farmConfig` object that `farmCapacity.ts` actually reads. |
| 6 | `006_repair_zone_assignment.ts` | Repairs agro-climatic zone assignment. |
| 7 | `007_merge_duplicate_plant_names.ts` | Merges catalog rows that were the same plant under two names (Okra/Ladies Finger, Methi/Fenugreek). |
| 8 | `008_recategorise_plants.ts` | Re-types garden plants whose catalog category moved (shrub→flower, vegetable→spinach) and relocates their stored overrides. |
| 9 | `009_realign_catalog.ts` | Finishes the Tamil Nadu catalog pass 008 started: renames garden plants off dropped duplicate rows (`Malabar Spinach`, `Amaranth Greens`), then re-types the six rows that moved category. |
| 10 | `010_merge_plantain_retype_castor.ts` | Folds `Ash Plantain` into `Banana` and re-files `Castor` under `herb`. |
| 11 | `011_repair_stale_tamil_names.ts` | Repairs Tamil names a stored override copied from a wrong bundled value. Touches only the stored overrides — a garden plant never records a Tamil name. |
| 12 | `012_recompute_plant_fields.ts` | Recomputes `lifecycle_type` **and** `crop_family` on every plant. Unlike 004, which only filled a missing `lifecycle_type`, this rewrites existing values: 004 used a derivation that checked `plant_type` before the catalog's own `lifecycle`, so every tree-typed plant was forced to `permanent` — wrong for Banana, Red Banana, Papaya, Pineapple and Passion Fruit, which are replanted or ratooned. `crop_family` was previously written only by the bed wizard, from a guild-template scan that resolved a fraction of the rows, so rotation was blind for most plants. Runs **after** 009-011 so it recomputes against the catalog as they leave it. Pure logic in `recomputedPlantFieldsLogic.ts`; returns null for an already-correct plant, so a re-run writes nothing. |
| 13 | `013_prune_removed_catalog_plants.ts` | Tombstones stored overrides for the 25 plants the bundled catalog dropped (the Tamil Nadu relevance pass at `de74376`, the placeholder `spinach` rows at `8fe36e7`, and four names inherited from the pre-git scaffold), and finishes the `Pepper` → `Capsicum` rename that shipped at `6b67b53` with no migration. Without this a dropped name lives on in `user_settings/{uid}.plantProfiles` and `getPlantNamesForType` re-lists it as a user addition — Lettuce, Spinach and Broccoli were still browsing under Vegetables → Other. Guards: an entry edited away from the record it last shipped as is left alone, as is any name a garden plant is still planted as. Tombstone rather than `delete`, because the profiles map reaches Firestore through a merge. Pure logic and the audited name list in `removedCatalogPlantsLogic.ts`. |
| 14 | `014_rename_palmyra.ts` | Moves garden plants and the stored override from `Palmyra` onto `Palm Tree`. Pure constants in `renamedPalmyraLogic.ts`. |
| 15 | `015_rename_growing_seasons.ts` | Moves stored `growingSeason` and variety `seasonSuitability` off the Kharif/Rabi vocabulary onto the zone-model seasons (SW Monsoon, NE Monsoon, Winter, Summer). Free-text seasons are left as written. Pure logic in `renamedSeasonsLogic.ts`. |
| 16 | `016_merge_cashew_nut.ts` | Folds a user-added `Cashew Nut` entry into the bundled `Cashew` row: garden plants renamed, and only the user's own additions (varieties, variety details, custom pests/diseases) carried onto the curated record, never the generic care fields a user-added entry was prefilled with. Engine `planFoldMerge` in `mergedCashewNutLogic.ts`. |
| 17 | `017_merge_duplicate_rows.ts` | Catalog clean-up. Long Brinjal, French Beans, Red Banana and Yardlong Beans become varieties of Brinjal, Beans, Banana and Cowpea; the four coconut rows become one `Coconut`. Garden plants move and keep what they were as their `variety` (unless one was set). Stored entries fold through `planFoldMerge`, and eight wrong Tamil names are repaired in stored copies (`STALE_TAMIL_NAMES_V17`). Constants in `mergedDuplicateRowsLogic.ts`. |
| 18 | `018_adopt_new_catalog_rows.ts` | Lychee, Citron, Batoko Plum (`fruit_tree`) and Broccoli (`vegetable`) became bundled rows after users had added them as their own entries — which, stored, replace the bundled record wholesale. Fills a missing Tamil name, description and varieties from the row, and drops care values still equal to the type defaults the entry form seeded, so the row's figures show through; anything the user changed is kept, and tombstones are left alone. Replaces the `plantProfiles` field whole (`mergeFields`), since a merge write cannot remove a key. Pure logic in `adoptedCatalogRowsLogic.ts`. Broccoli left `REMOVED_CATALOG_PLANTS_V13` at the same time, so 013 cannot prune the new row on an older install. |

## Known gap

`runPendingMigrations` is invoked with `.catch()` rather than awaited in `App.tsx`, and the
runner swallows failures (returns on schema-read failure; catches and breaks on a migration
throw). Screens can therefore render while a migration is still running. Gating launch on
the runner is tracked as a follow-up; every migration must stay rerun-safe in the meantime.

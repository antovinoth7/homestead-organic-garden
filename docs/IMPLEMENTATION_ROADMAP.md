# Organic Gardening Planner — Implementation Roadmap

> Generated: April 12, 2026
> Last updated: July 5, 2026 — **Post-ship reconciliation (dev→main release delta; no new scope, no schema changes).** All work extends shipped phases. **Phase C extension**: the single `WeatherCard` grew into a location-aware, swipeable multi-plot deck (`WeatherDeck`/`WeatherPlotCard`, `useWeatherLocations`, `config/zones/districtCoordinates.ts` — first concrete step parameterizing the hardcoded-district risk); Today dashboard compacted (active-first progress chips, Garden Health reordering, task list folded into the progress donut). **Phase E extensions**: journal list overhaul (`JournalEntryCard` extraction, swipe edit/delete, grid view dropped); voice dictation extended to all notes/analysis fields via reusable `VoiceDictation` (G10 follow-through); pest/disease history photos with capture-time device-local compression (`expo-image-manipulator` → `utils/imageCompression.ts`) + shared pinch-zoom viewer (`ImageZoomModal`/`usePinchZoom`). Shared `ConfirmDeleteModal` replaced `BedDeleteModal` and the catalog/farm delete flows. **B2 maintenance**: bed wizard/map fixes; first care tasks now scheduled from the planting date with auto-selected care-plan segment (`services/taskSchedulingLogic.ts`). Nav restructure introduced `AuthedStackParamList` (fixes the duplicate nested screen-name warning). Note: four cache-first-paint perf commits were tried and reverted — that approach remains an open want.
> **2026-07-05 (later same day) — Offline write queue + performance pass.** Closed the Critical "No Offline Mutation Queue" risk: `writeOrQueue()` (`lib/offlineWrite.ts`) + AsyncStorage queue (`lib/offlineQueue.ts`, coalescing in `utils/offlineQueueLogic.ts`) + FIFO replay-on-reconnect (`services/offlineSync.ts`) + `OfflineBanner`/`useOfflineStatus`; creates moved to client-generated doc ids across plants/tasks/journal/beds/locations/farmCapacity. Performance: CalendarScreen task area virtualized (ScrollView `.map()` → `SectionList`), `PlantCard` memoized, catalog picker filter allocation fixed, migration runner now skips its per-launch Firestore read via a local schema-version cache.
> Older "Previous:" reconciliation notes: `docs/archive/ROADMAP_ARCHIVE.md`.
> Status: Phase 0 / A / A2 / B / B2 / B3 / B4 / C / D / E / F shipped (Phase B with deliberate deferrals); Phase G–H planned
> Scope: Solo developer, iterative build, Firebase free-tier

---

## Progress Tracker

| Phase                                        | Status         | Shipped    |
| -------------------------------------------- | -------------- | ---------- |
| Phase 0 — Stabilization                      | ✅ Complete    | 2026-04-16 |
| Phase A — Config: Pest & Disease Reference   | ✅ Complete    | 2026-04-18 |
| Phase A2 — Config: Catalog Enrichment        | ✅ Complete    | 2026-04-18 |
| Phase B — Plants                             | ✅ Complete\*  | 2026-06-20 |
| Phase B2 — Bed Management (expanded)         | ✅ Complete    | 2026-05-01 |
| Phase B3 — Farm Setup + Capacity             | ✅ Complete    | 2026-06-06 |
| Phase B4 — Input Recipes + Seasonal Adapt.   | ✅ Complete    | 2026-06-20 |
| Phase C — Home (dashboard overhaul)          | ✅ Complete    | 2026-06-20 |
| Phase D — Calendar                           | ✅ Complete    | 2026-06-20 |
| Phase E — Journal                            | ✅ Complete    | 2026-06-20 |
| Phase F — Settings & Cross-Cutting           | ✅ Complete    | 2026-06-20 |
| Phase G — Tamil i18n                         | ⚪ Planned     | —          |
| Phase H — Advanced                           | ⚪ Planned     | —          |
| Phase A3 — Config: Beneficials + Custom CRUD | ⏭ Deferred     | —          |

> \*Phase B — Plants complete with deliberate deferrals: B.1 `EditBotanicalIdentitySection` (no botanical data source), B.5 (subsumed by B2), B.7 (seed source), B.8 (PlantNowBanner → Phase C); B.10 has pure-logic test coverage (component smoke tests optional). All functional plant features shipped.

> Per-phase delivered detail (Phases 0–F) is in `docs/archive/ROADMAP_ARCHIVE.md`.

---

## 1. Current System Summary

### What's Fully Built (Production-Ready)

| Feature                        | Key Files                                           | Status                                                                    |
| ------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Firebase Auth (email/password) | `AuthScreen`, `firebase.ts`                         | ✅ Rate limiting, token refresh, error handling                           |
| Plant CRUD                     | `plants.ts`, `PlantFormScreen`, `PlantDetailScreen` | ✅ 40+ fields, soft-delete, pagination, image support                     |
| Recurring Task System          | `tasks.ts`, `CalendarScreen`                        | ✅ Auto-sync from plant settings, season-aware watering, batch completion |
| Journal (Multi-Image)          | `journal.ts`, `JournalFormScreen`                   | ✅ 5 entry types incl. harvest, legacy photo compat                       |
| Calendar Views                 | `CalendarScreen`, `useCalendarData`                 | ✅ Week/month, grouping, filtering, swipeable task cards                  |
| Location Management            | `locations.ts`, `ManageLocationsScreen`             | ✅ Parent/child hierarchy, soil profiles (pH, NPK, drainage)              |
| Plant Catalog                  | `plantCatalog.ts`, `ManagePlantCatalogScreen`       | ✅ Type→variety mapping, variety aliases, user customization              |
| Care Profiles                  | `plantCareProfiles.ts`, `plantCareDefaults/`        | ✅ 160+ variety defaults, frequency/soil/fertiliser overrides             |
| Image Storage                  | `imageStorage.ts`                                   | ✅ MediaLibrary (Android), documentDirectory (iOS), migration             |
| Images-Only Backup             | `backup.ts`, `SettingsScreen`                       | ✅ ZIP export/import, filename-based matching                             |
| Theme System                   | `theme/`, 25 style files                            | ✅ Light/dark/system, comprehensive tokens                                |
| Error Infrastructure           | Sentry, `errorLogging.ts`, `ErrorBoundary`          | ✅ Global handlers, structured logging, PII sanitization                  |

### Domain Logic Already Built

| Domain Area                | File                                      | Depth                                                                                                  |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 4-Season Kanyakumari Model | `seasonHelpers.ts`                        | Month ranges, watering multipliers per space type, 120+ pest alerts                                    |
| Companion Planting         | `plantHelpers.ts`                         | 130+ varieties, 770+ companion pairs, 30+ incompatibilities                                            |
| Pest/Disease Intelligence  | `plantHelpers.ts`                         | Type-specific + 23 crop-specific profiles, 160+ organic treatments                                     |
| Coconut Age-Based Care     | `plantHelpers.ts`                         | 6 age stages, nutrient deficiencies, yield expectations                                                |
| Pruning Techniques         | `plantCareDefaults/`                      | 40+ variety-specific guides with seasonal timing                                                       |
| Harvest Date Estimates     | `plantCareDefaults/`, `plantHelpers.ts`   | 100 vegetables/herbs (daysToHarvest range), 23+ trees (yearsToFirstHarvest), growingSeason per variety |

### What's Partially Built

| Feature               | Existing Foundation                                                                                                                 | Gap                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Harvest Tracking      | `JournalEntry` has `harvest_quantity`, `harvest_unit`, `harvest_quality`, `harvest_notes`; `HarvestHistorySection` component exists; readiness shares one rule across Care Plan + Today, and logging a harvest closes its due task | No yield analysis, no income tracking; **harvest dates are zone-blind** — the source-reviewed `maturityDays` in `tamilNaduPlantingCalendar.ts` is not consulted by any harvest estimate (see docs/DOMAIN_LOGIC.md → Harvest Readiness) |
| Companion Planting UI | Functions in `plantHelpers.ts`, surfaces on `PlantDetailScreen`                                                                     | No zone-aware warnings, no intercropping planner                                                         |
| Soil Profiles         | `LocationProfile` has pH/NPK/drainage/soil_type fields                                                                              | Data stored but no recommendation engine, no amendment suggestions                                       |
| Growth Stages         | Static `growth_stage` field on `Plant`, 6 stages defined; `getCoconutAgeInfo()` computes coconut age stages from planting date      | No auto-progression, no stage history, no per-variety stage durations, no annual cycling for fruit trees |
| Default Catalog       | `DEFAULT_PLANT_CATALOG` exists with ~100 Kanyakumari crops                                                                          | ✅ Tamil names, descriptions, spacing/yield data enriched (Phase A2). No planting windows yet.           |

---

## 2. Key Problems / Risks

> Reviewed 2026-06-15. Two previously-listed risks are now **resolved** and removed: _No Schema
> Migration System_ (migration runner + `LATEST_SCHEMA_VERSION` = 4 shipped in Phase 0; see
> `docs/SCHEMA_MIGRATIONS.md`) and _Minimal Test Coverage_ (was 2 files; now 33 test files
> spanning utils/config/services/hooks/components). A residual test risk is reframed under Medium.

### Critical

1. ~~**No Offline Mutation Queue**~~ — **Resolved 2026-07-05.** Offline writes now persist to an AsyncStorage mutation queue (`src/lib/offlineQueue.ts` + `writeOrQueue()` in `src/lib/offlineWrite.ts`), apply optimistically to the local cache, and replay FIFO on reconnect (`src/services/offlineSync.ts`, wired in `App.tsx`). `OfflineBanner` surfaces offline state and pending-sync count. Creates switched to client-generated doc ids so optimistic records survive sync. See `docs/SERVICES.md` → Offline Write Queue. Residual: on-device airplane-mode validation pending.
2. **No Onboarding**: Users land on an empty TodayScreen after signup with no guidance (G17, Phase F).

### High

1. **Hardcoded Kanyakumari Constants**: Season boundaries, location defaults ("Mangarai", "Velliavilai"), pest alerts all embedded directly in code. Expanding to other districts requires parameterization. *(2026-07-05: first step taken — `config/zones/districtCoordinates.ts` parameterizes per-district coordinates for the weather deck; season/pest constants still hardcoded.)*
2. **No i18n Infrastructure**: UI screens and components have hardcoded English strings. Tamil support (Phase G) requires extracting every string first; `tamilName` data already exists from Phase A2.
3. **No Full Data Export**: Can export images but not plant/journal/task records — users cannot back up their actual data (G18, Phase F).

### Medium

1. **Direct Firestore Coupling**: Every service imports from `firebase/firestore`. Not a problem now but increases cost of any backend migration (G19).
2. **Large Hook**: `usePlantFormState` returns 120+ properties. Works but difficult to maintain.
3. **Test Coverage Shallow Despite Breadth**: 33 test files exist, but coverage thresholds sit at 30% and only `src/utils` + `src/config` are measured; services/hooks lack emulator-backed tests, and CLAUDE.md rule #7 ("never mock Firestore — use emulator") has no emulator wired into CI. Tighten thresholds and add an emulator harness as the suite grows. _(Resolved 2026-06-20: the date-dependent `growthStage` test flakiness — `computeExpectedGrowthStage`/`computeAnnualCycleStage` dropped a day when run before local noon — is fixed by anchoring "now" to noon for a stable calendar-day count; full suite is now deterministically green.)_

---

## 3. Gap Analysis Table

| #   | Feature                                                         | Current State                                                  | Gap Category         | Effort | Impact    | Priority                            |
| --- | --------------------------------------------------------------- | -------------------------------------------------------------- | -------------------- | ------ | --------- | ----------------------------------- |
| G1  | Schema Migration System                                         | None                                                           | Critical             | M      | High      | Phase 0 ✅                          |
| G2  | Default Catalog Seeding (Tamil names, spacing, yield)           | Partial defaults exist                                         | High-Value           | M      | High      | Phase A2                            |
| G3  | Season-Aware Planting Calendar ("What to Plant Now")            | Season model exists, no planting windows                       | High-Value           | S      | High      | Phase C                             |
| G4  | Weather Integration (Open-Meteo)                                | None                                                           | High-Value           | S      | Medium    | Phase C                             |
| G5  | Enhanced Harvest Tracking & Yield Dashboard                     | Readiness + logging unified; no yield analysis, no zone-aware maturity | High-Value           | M      | High      | Phase B                             |
| G6  | Growth Stage Progression (Auto + Annual Cycling)                | Static field, no history, no auto-computation                  | High-Value           | M      | High      | Phase B                             |
| G7  | Multi-Layer / Zone-Based Planting                               | No zone concept                                                | High-Value           | L      | High      | Phase B2 ✅                         |
| G8  | Organic Pest & Disease Advisor (enriched)                       | 160+ treatments exist, no recipes/calendar                     | High-Value           | M      | Medium    | Phase A (done) / A3 (deferred)      |
| G9  | Coconut Individual Tree Tracking                                | Coconut fields exist, per-tree not streamlined                 | High-Value           | M      | High      | Phase B                             |
| G10 | Voice-to-Text (Tamil)                                           | ✅ Shipped (expo-speech-recognition, Tamil + English toggle)   | High-Value           | S      | Medium    | Phase E ✅                          |
| G11 | Journal Tags                                                    | No structured tags                                             | Nice-to-Have         | S      | Medium    | Phase 0 ✅                          |
| G12 | Crop Rotation Planner                                           | No rotation logic                                              | High-Value           | M      | Medium    | Phase B2 ✅ (subsumed)              |
| G13 | Organic Input Recipes (static reference)                        | FertiliserType enum exists                                     | High-Value           | S      | Medium    | Phase A3 (deferred)                 |
| G14 | Seed Source & Variety Log                                       | `plant_variety` exists, no `seed_source`                       | Nice-to-Have         | S      | Low       | Phase B                             |
| G15 | Seasonal Labour Calendar (Farmer's Almanac)                     | None                                                           | Nice-to-Have         | S      | Medium    | Phase C                             |
| G16 | Tamil i18n                                                      | None                                                           | Critical (for scale) | L      | High      | Phase G                             |
| G17 | Onboarding Flow                                                 | None                                                           | High-Value           | M      | High      | Phase F                             |
| G18 | Data Backup (full export/import)                                | Images-only backup exists                                      | High-Value           | M      | Medium    | Phase F                             |
| G19 | Data Abstraction Layer                                          | Direct Firestore coupling                                      | Nice-to-Have         | L      | Low       | Defer                               |
| G20 | Multi-User / RBAC                                               | Single-user `user_id` scoping                                  | Nice-to-Have         | XL     | Low       | Defer                               |
| G21 | Financial Ledger                                                | None                                                           | Nice-to-Have         | L      | Medium    | Defer                               |
| G22 | Land & Plot Mapping                                             | Locations are string labels                                    | Nice-to-Have         | L      | Medium    | Phase H (partially addressed by B2) |
| G23 | Soil Health Recommendations                                     | Profile stored, no engine                                      | Nice-to-Have         | M      | Medium    | Phase H                             |
| G24 | Labour Tracking                                                 | None                                                           | Nice-to-Have         | M      | Low       | Defer                               |
| G25 | Water Management                                                | None                                                           | Nice-to-Have         | M      | Low       | Defer                               |
| G26 | Lifecycle Economics                                             | Age calc exists, no ROI projection                             | Nice-to-Have         | M      | Medium    | Phase H                             |
| G27 | Zone-Aware Config (State-Level Expansion)                       | Hardcoded Kanyakumari                                          | Nice-to-Have         | XL     | Low (now) | Defer                               |
| G28 | Test Coverage (30% minimum)                                     | 33 test files, 30% threshold (utils/config only); suite deterministically green | Critical             | L      | High      | Ongoing 🔄 (raise threshold + emulator)|
| G29 | Pest/Disease/Beneficial Reference (detail pages)                | 160+ treatments exist, no detail pages or browseable reference | High-Value           | M      | High      | Phase A (done) / A3 (deferred)      |
| G30 | Per-Variety Custom Pests/Diseases/Beneficials                   | Static lists only, no user customisation per variety           | High-Value           | S      | Medium    | Phase A3 (deferred)                 |
| G31 | Bed Management                                                  | Free-text `bed_name` on Plant, no bed entity or rotation       | High-Value           | XL     | High      | Phase B2 ✅                         |
| G32 | Farm Setup Screen (cents, trees, families, goals)               | Shipped in `MyFarmScreen` + `FarmConfig`                       | High-Value           | S      | High      | Phase B3 ✅                         |
| G33 | Land Capacity Engine (usable sqm, max beds, food category bars) | `farmCapacity.ts` engine + `useFarmCapacity`                   | High-Value           | M      | High      | Phase B3 ✅                         |
| G34 | Full-Year Harvest Guarantee Grid (category × season)            | `calcCategoryPct` + `getPhase3YearPlan` shipped               | High-Value           | M      | High      | Phase B3 ✅                         |
| G35 | Organic Input Recipes (personalized by farm size)               | `InputRecipesScreen` + recipe engine + config                 | High-Value           | M      | High      | Phase B4 ✅                         |
| G36 | Seasonal Adaptation + Pre-Monsoon Batch                         | ✅ Done — standalone screen cut; surfaced as TodayScreen cards | High-Value           | M      | Medium    | Phase B4 ✅ (re-homed to Today)     |
| G37 | Dynamic Accumulators (chop-drop tracking, 4 plants)             | None — Agathi, Moringa, Comfrey, Banana with intervals         | High-Value           | S      | High      | Phase B2 ✅                         |
| G38 | Harvest Gap Detector (cross-bed same-guild clearing)            | None                                                           | High-Value           | S      | High      | Phase B2 ✅                         |
| G39 | Cross-Bed Coordinator (6-rule farm-wide rotation check)         | None                                                           | High-Value           | S      | High      | Phase B2 ✅                         |
| G40 | Green Manure Engine (season-correct recommendation)             | None — Sunhemp/Cowpea/Dhaincha by season                       | High-Value           | S      | High      | Phase B2 ✅                         |
| G41 | Two-Tier Task System (bed-level + plant-level)                  | None — all tasks currently plant-level only                    | High-Value           | M      | High      | Phase B2 ✅                         |
| G42 | Interval Conflict Resolution Engine (min-interval wins)         | None                                                           | High-Value           | S      | Medium    | Phase B2 ✅                         |
| G43 | Transition Inputs Prescription (fromFamily → soil prep)         | None                                                           | High-Value           | S      | Medium    | Phase B2 ✅                         |
| G44 | Stacked Alert Cards with Swipe Dismiss                          | None — TodayScreen has basic alert list                        | High-Value           | M      | High      | Phase C                             |
| G45 | Add Plant to Catalog Wizard (standalone)                        | ManagePlantCatalogScreen lacks quick-add wizard from bed flow  | High-Value           | M      | Medium    | Phase B2 ✅                         |

---

## 4. Recommended Architecture Adjustments

### 4.1 / 4.2 — ✅ Shipped (Phase 0)

Schema migration system (G1) and season-config extraction shipped as designed. Details: `docs/archive/ROADMAP_ARCHIVE.md`.

### 4.3 Do NOT Build: Data Abstraction Layer (G19)

**Why defer**: The app has 5 service files. Each is ~200-400 lines. The Firestore SDK coupling is manageable. The abstraction would add complexity without solving a real problem today. The existing `withTimeoutAndRetry()` wrapper already centralizes retry/timeout logic. Only build this when a backend migration is actually planned.

### 4.4 Do NOT Build: Multi-User / RBAC (G20)

**Why defer**: This requires redesigning every Firestore query, security rule, and cache key. It's a fundamental architecture change, not a feature addition. Current single-farmer scope is correct for a personal app. Only revisit if actual multi-farm demand materializes.

### 4.5 Implementation Approach: Screen-by-Screen

This roadmap is organized **screen-by-screen** rather than by feature priority. Each phase targets a specific screen group, bringing it to a "done" state before moving to the next. This approach reduces context-switching for a solo developer and ensures each screen ships polished.

**Order**: Config (More tab) → Plants → Home → Calendar → Journal → Settings → Tamil i18n → Advanced

Shared foundations (types, services, config files) are built in the phase that first needs them. Each phase follows: define types → build/extend services → build/extend hooks → polish screen → write tests.

**Tamil language strategy**: Full-app English ↔ Tamil toggle in Settings (Phase G). No mixing of languages in any screen. Tamil plant names (`tamilName` on care profiles) are DATA and ship with catalog enrichment (Phase A2), but are **only displayed when the user switches to Tamil in Settings (Phase G)**. Until Phase G ships, the UI is English-only.

---

## 5. Phased Roadmap

> **Completed phases (0, A, A2, B, B2, B3, B4, C, D, E, F)** — step tables, delivered notes,
> and verification checklists moved verbatim to `docs/archive/ROADMAP_ARCHIVE.md`.
> Only deferred/planned phases remain below.

### Phase A3: Config — Beneficials + Custom Entry CRUD (F10) — ⏭ DEFERRED (after Phase H)

**Goal**: Beneficials reference as separate More menu item. Custom entry CRUD for pests/diseases/beneficials. Organic input recipes reference. No unified hub screen.

> **Deferred**: Skipping A3 now — Beneficials and custom CRUD are not blocking for Phase B/B2. Will revisit after Phase H.
> **Screens**: BeneficialListScreen (NEW), BeneficialDetailScreen (NEW)

| Step | Feature                                                                                          | Effort | Risk | Dependencies    |
| ---- | ------------------------------------------------------------------------------------------------ | ------ | ---- | --------------- |
| A3.1 | Create `src/config/beneficials/` — kanyakumari.ts (~20 entries), index.ts                        | S      | Low  | None            |
| A3.2 | Define `BeneficialReference` type in `database.types.ts`                                         | S      | Low  | None            |
| A3.3 | Navigation: add Beneficials route to More stack, add menu item to MoreScreen                     | S      | Low  | A3.2            |
| A3.4 | BeneficialListScreen + BeneficialDetailScreen                                                    | M      | Low  | A3.1, A3.3      |
| A3.5 | `customReferences.ts` service — custom entry CRUD in user_settings                               | S      | Low  | A3.2            |
| A3.6 | Custom Entry CRUD UX — add/edit/delete from reference list screens + ManagePlantCatalog modal    | S      | Low  | A3.4, A3.5      |
| A3.7 | Organic Input Recipes reference — static `organicInputs.ts` (Jeevamrutha, Panchagavya, neem oil) | S      | Low  | None — parallel |
| A3.8 | Styles: `beneficialListStyles.ts`, `beneficialDetailStyles.ts`                                   | S      | Low  | A3.4            |
| A3.9 | Tests: `beneficials.test.ts`, `customReferences.test.ts`                                         | S      | Low  | A3.1, A3.5      |

**Verification**:

- More tab shows Beneficials menu item
- ~20 entries browseable with search filter
- Tap "Ladybird Beetle" → BeneficialDetailScreen with Common Species, Why Helpful, How To Attract, Plants To Grow, Pests Controlled
- Custom pest "Snail" can be added, appears in list + available in ManagePlantCatalog care modal

---

### Phase G: Tamil i18n (G16)

**Goal**: Full-app language toggle (English ↔ Tamil) via Settings. No mixing.
**Screens**: All screens

| Step | Feature                                                        | Effort | Risk   | Dependencies                    |
| ---- | -------------------------------------------------------------- | ------ | ------ | ------------------------------- |
| G.1  | i18next + react-i18next + expo-localization setup              | S      | Low    | None                            |
| G.2  | Extract all hardcoded strings from 13 screens + 12+ components | L      | Medium | All Phase A–F features complete |
| G.3  | Tamil translation file                                         | L      | Medium | G.2                             |
| G.4  | Language toggle in SettingsScreen                              | S      | Low    | G.1                             |

**Verification**:

- Toggle to Tamil → all UI strings switch. Toggle back → English. No mixing

---

### Phase H: Advanced (Later)

**Goal**: Deepen domain intelligence, prepare for scale.

| Step | Feature                                                                                                                                                        | Effort | Risk   | Dependencies                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ | ---------------------------------------- |
| H.1  | Crop Rotation Planner (G12) — **Subsumed by Phase B2.10** (rotation engine). Remainder: advanced multi-season rotation planning UI, rotation history analytics | M      | Low    | Phase B2                                 |
| H.2  | Farm Zone Mapping (G22) — **Partially addressed by Phase B2** (beds with dimensions + location_id). Remainder: inter-bed spatial layout, full farm SVG map     | L      | Medium | Phase B2                                 |
| H.3  | Soil Health Recommendations (G23) — pH-based liming/amendment suggestions from LocationProfile                                                                 | M      | Low    | None                                     |
| H.4  | Lifecycle Economics (G26) — maintenance cost vs. yield projection for perennials, replacement ROI                                                              | M      | Medium | Phase B (harvest data, coconut tracking) |
| H.5  | Zone-Aware Config System (G27) — full parameterization for 7 TN agro-climatic zones                                                                            | XL     | High   | Phase 0, Phase G                         |

---

## 6. Feature-Level Breakdown

Feature specs F1–F19 belong to shipped phases and moved to `docs/archive/ROADMAP_ARCHIVE.md`.
F10 (Beneficials + Custom CRUD, Phase A3 — deferred) is also archived; pull it back here when A3 is picked up.

---

## 7. Data & Migration Strategy

### Migration System Design

1. **Version tracking**: `user_settings/{uid}.schema_version` (integer, starts at 0)
2. **Migration files**: `src/migrations/NNN_descriptiveName.ts`, each exports `{ version, name, up(uid) }`
3. **Runner**: `src/migrations/index.ts` — `runPendingMigrations(uid)`:
   - Read current `schema_version`
   - Filter migrations where `version > current`
   - Run sequentially
   - Update `schema_version` after each success
   - Log failures to Sentry, don't crash app
4. **Idempotency**: Each migration checks if transformation already applied before modifying
5. **Batch limits**: Process max 500 docs per `writeBatch()` (Firestore limit)

### Migration Timeline (by Phase)

| Migration              | Phase      | Schema Change                                                               |
| ---------------------- | ---------- | --------------------------------------------------------------------------- |
| 001_backfill_district  | Phase 0 ✅ | District + zone backfill (Kanyakumari / high_rainfall)                      |
| 002_seedCatalog        | Phase A    | Enriches catalogs with Tamil names/varieties, botanical identity, nutrition |
| 003_harvestLogs        | Phase B    | Creates `harvest_logs` from journal harvest entries                         |
| 004_growthStageHistory | Phase B    | Initializes `growth_stage_history` from current stage                       |
| 005_plantingZones      | Phase B    | Adds `planting_zone` to plants                                              |

> **Removed from plan**: `003_plantingWindows` — planting windows are config data on care profiles, not user data requiring migration. `007_journalTags` — already shipped in Phase 0.

### Risky Data Changes

- **004_harvestLogs**: Creates new collection from existing journal data. Must NOT delete original journal entries (they remain as the source of truth). Harvest logs are a materialized view.
- **002_seedCatalog**: Must merge with user customizations, not overwrite. Use existing normalization pattern in `plantCatalog.ts`.

---

## 8. Final Recommendations

> DO NOW / DO NEXT / DO AFTER tranches all shipped — see `docs/archive/ROADMAP_ARCHIVE.md`.

### Farmer-Operations Roadmap (Proposed)

The shipped product is a strong personal cultivation planner. The next product question is
whether it should remain focused on planning a homestead garden or grow into a lightweight
small-farm operations tool. The following proposals capture the highest-value gaps from a
working farmer's point of view without committing them to the active delivery schedule.

#### Recommended sequence

| Order | Proposal                                     | Farmer value                                                     | Initial scope                                                         |
| ----: | -------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
|     1 | Full data backup and portable export         | Protects the farm record and avoids product lock-in              | Versioned archive plus human-readable CSV exports                     |
|     2 | Local task notifications                     | Prevents missed irrigation, treatment follow-up, and harvests    | On-device reminders, quiet hours, and per-task preferences            |
|     3 | Input inventory and application traceability | Controls stock and creates an organic input/application register | Purchases, batches, expiry, stock adjustments, and application logs   |
|     4 | Harvest sales and crop profitability         | Shows which crops and beds actually return value                 | Destination, buyer, price, direct costs, payment state, and summaries |
|     5 | Tamil UI and simplified field workflows      | Makes daily use practical for more farmers and family members    | Typed i18n catalogs, bilingual display, and icon-led common actions   |
|     6 | Soil amendment recommendations               | Turns stored test values into actions                            | Explainable crop-aware recommendations and follow-up tasks            |
|     7 | Irrigation zones and water budgeting         | Reduces unnecessary watering and records source constraints      | Duration-first logs with optional flow/volume estimates               |
|     8 | Family and worker collaboration              | Supports farms operated by more than one person                  | Farm membership, roles, assignment, attribution, and audit history    |

#### 1. Full data backup and portable export

- Extend `services/backup.ts` beyond images to plants, beds, locations, tasks and logs,
  journal entries, farm configuration, catalog customizations, and care-profile overrides.
- Use a versioned, validated manifest; preview record counts and conflicts before import.
- Provide safe replace and merge modes, run migrations after validation, and create a
  pre-import recovery backup before destructive operations.
- Export harvest, expense, input-application, and task history as CSV so records remain usable
  outside the app.

**Done when:** a farmer can move a complete farm to a new device/account-compatible install,
inspect the export without this app, and recover cleanly from an interrupted import.

#### 2. Local task notifications

- Schedule on-device reminders for due/overdue care, active pest or disease follow-up,
  harvest windows, and rain-sensitive work; do not require a paid push backend.
- Use stable notification identifiers so edits replace old reminders rather than duplicating
  them, and reschedule after relevant plant, task, or settings changes.
- Add quiet hours, lead time, category, and per-plot preferences in Settings.
- Keep sensitive notes out of lock-screen text and provide a useful in-app fallback when
  notification permission is denied.

**Done when:** reminders remain correct after task edits, completion, app restart, timezone
change, and periods without connectivity.

#### 3. Input inventory and organic traceability

- Add input items, suppliers, purchases, batch/lot and expiry data, certification notes, stock
  adjustments, and application records.
- Link each application to a plot/bed/plant, task or journal entry, date, dosage, operator,
  reason, and optional evidence photo.
- Offer “record input used” while completing spray and fertilising work, with auditable
  corrections rather than silent edits to historical stock.
- Show low-stock and approaching-expiry warnings and export a printable/CSV organic
  application register.

**Done when:** current stock reconciles from transactions and a farmer can produce a complete
input-use history for any crop and season.

#### 4. Harvest sales and crop profitability

- Add a harvest destination: sold, home use, shared, seed, animal feed, or waste.
- For sales, capture grade, buyer/market, unit price, gross value, transport and other direct
  deductions, and payment status. Preserve journal harvests as the source of truth or migrate
  them idempotently into a dedicated harvest model.
- Summarize yield, revenue, direct cost, and estimated margin by crop, bed, and season.
- Keep this deliberately lighter than general accounting; export transactions to CSV instead
  of building a full financial ledger.

**Done when:** a farmer can answer how much was harvested, where it went, what was paid, what
remains outstanding, and the estimated return for a crop/bed/season.

#### 5. Tamil UI and low-literacy field use

- Add typed English and Tamil message catalogs and a persisted language preference.
- Translate high-frequency field workflows first: Today, care completion, Beds, Plant Detail,
  Journal entry, validation, alerts, and accessibility labels.
- Retain Tamil and English crop-name search, add an optional bilingual display, and localize
  dates, numbers, units, and voice-recognition locale.
- Prefer icon-plus-text actions, large touch targets, short forms, and voice entry for outdoor
  use; translation alone is not sufficient.

**Done when:** the core daily loop can be completed entirely in Tamil without falling back to
an untranslated dialog, validation message, or notification.

#### 6. Soil amendment recommendations

- Preserve soil-test history instead of overwriting the latest pH/NPK/drainage observation.
- Build a pure, tested recommendation engine using soil profile, planned crop/family, bed area,
  and season.
- Return explainable findings, conservative organic amendment ranges, timing,
  contraindications, confidence/limitations, and a suggested retest date.
- Let farmers turn selected recommendations into bed-level work and record the actual input
  applied. Do not present estimated advice as a laboratory prescription.

**Done when:** each recommendation explains the observed problem, proposed action, calculation
assumptions, and follow-up measurement.

#### 7. Irrigation zones and water budgeting

- Link beds to irrigation zones with source, delivery method, schedule, and optional flow rate,
  pump, or valve identifiers.
- Estimate need from crop requirement, bed area, growth stage, recent/forecast rain, soil
  moisture retention, and delivery efficiency, while clearly labeling estimates.
- Record duration, optional volume, observed soil state, skipped-because-of-rain, and
  source-unavailable outcomes during watering completion.
- Remain useful without meters: duration-only logging must be a first-class workflow.

**Done when:** a farmer can see upcoming weekly demand and compare it with recorded irrigation
and rainfall without being required to own a flow meter or sensor.

#### 8. Optional family and worker collaboration

- Introduce farm membership separately from Firebase user identity, with owner, manager, and
  worker roles. Migrate every existing account to a single-owner farm without changing its
  normal single-user experience.
- Add task assignment, completion attribution, short worker notes, invitation revocation, and
  an audit trail for important changes.
- Restrict configuration deletion, backup restore, catalog administration, and financial
  visibility by role; never solve collaboration by sharing one login.
- Design Firestore authorization, offline conflicts, and multi-device tests before enabling
  the user-facing feature.

**Done when:** two devices can safely work on the same farm, each important write is attributable,
and a removed member can no longer read or modify farm data.

#### Scope guardrails

1. Treat this section as **candidate scope**, not an approved commitment; validate each item
   with farmers before assigning it to a phase.
2. Prefer optional progressive fields and quick defaults over bookkeeping-heavy mandatory forms.
3. Every field workflow must remain offline-capable and recover safely from partial sync.
4. Add only the smallest financial features needed for crop decisions; do not become a general
   accounting or payroll product.
5. Introduce collaboration last because it changes authorization, ownership, synchronization,
   migrations, and support expectations across the whole application.

### DO LATER (Phase G–H)

1. **Tamil i18n** — only after all screens feature-complete (extracting strings from moving targets is waste)
2. **Farm mapping remainder, soil recs, lifecycle economics** — deeper domain intelligence (crop rotation moved to Phase B2)

### DO NOT BUILD (Current Stage)

| Feature                    | Reason                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| Multi-User / RBAC          | Rewrites entire data model. No demand from a personal-use app.                           |
| Financial Ledger           | Accounting is a different product. Start with `sale_price` on harvest_logs.              |
| Data Abstraction Layer     | 5 small service files don't justify the abstraction cost. Build when migrating backends. |
| Labour Tracking            | Niche enterprise need. Track worker costs as notes on task_logs for now.                 |
| Water Management Module    | Covered by weather integration + existing watering tasks.                                |
| State-Level Zone Expansion | Build Kanyakumari bulletproof first. Other zones = same template with different data.    |
| Government Scheme Tracker  | External data dependency with no reliable API. Link to websites instead.                 |
| Full Plot GPS Mapping      | String-based zones + bed names are sufficient for half an acre.                          |

### Architecture Principles for All Phases

1. **Schema changes go through migrations** — no more "hope old data works"
2. **New collections follow the existing service pattern** — cache → auth → Firestore → fallback
3. **Domain data is config, not code** — season boundaries, pest alerts, planting windows should be data objects, not inline logic
4. **Static reference data stays in-app** — organic recipes, farmer's almanac, pest reference images are app assets, not Firestore (keeps free-tier viable)
5. **Test new services** — every new service file (`harvests.ts`, `weather.ts`) gets unit tests from day one

---

## Design Decisions (Open for Discussion)

### Coconut Per-Tree Tracking Model

- **Option A**: `tree_number` field on `HarvestLog` linking to existing `Plant` entry — simpler, "harvested 45 nuts from tree #7"
- **Option B**: Separate `CoconutTree` child collection under a parent `Plant` — supports per-tree care schedules
- **Recommendation**: Option A first. Upgrade to B only if farmers need per-tree watering/fertilising differences.

### Farmer's Almanac Location

- **Option A**: Static content rotating monthly on `TodayScreen`
- **Option B**: Dedicated screen in More tab with full-year view
- **Recommendation**: Both — monthly highlight on TodayScreen with "View full almanac" link.

### Voice-to-Text Library ✅ Decided (Phase E)

- `expo-speech` handles TTS only, not STT — not applicable.
- `@react-native-voice/voice` requires dev client (not Expo Go), supports Tamil well.
- **Chosen**: `expo-speech-recognition` — Expo SDK 54 config-plugin support, BCP-47 locale
  control (`ta-IN`/`en-IN`), interim/partial results, on-device + network. Dev client was
  already in use, so the native rebuild is the only extra step.

### Harvest Logs vs. Extended Task Logs

- **Option A**: New `harvest_logs` collection — clean separation, purpose-built fields (sale_price, buyer_market, destination)
- **Option B**: Extend existing `task_logs` with harvest fields — less migration, reuses existing service
- **Recommendation**: Option A. Harvests have fundamentally different data needs (quantity, market, income) that don't fit the task completion model.

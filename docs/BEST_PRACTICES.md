# Best Practices — Organic Gardening Planner

> Companion to `docs/IMPLEMENTATION_ROADMAP.md`. Prioritized, actionable recommendations for
> keeping the app well-crafted for **small organic farmers** in Tamil Nadu / Kanyakumari.
> Last reviewed: 2026-07-05. These are recommendations only — each links to the roadmap gap (Gxx)
> or phase where the work belongs.
>
> Priority key: **P1** = do soon (real user pain or correctness risk) · **P2** = important, schedule
> deliberately · **P3** = polish / long-horizon.

The codebase is already strong: strict TypeScript (`noUncheckedIndexedAccess`), ESLint enforcing
the CLAUDE.md critical rules (no `any`, no inline styles, no color literals, `@/` alias), offline
in-memory + AsyncStorage cache, a schema-migration runner, Sentry, and CI. The items below are the
deltas worth investing in next.

---

## 1. Performance

| # | Area | Current state | Recommendation | Priority |
| - | ---- | ------------- | -------------- | -------- |
| P-1 | Long lists | ✅ **Done (2026-07-05)** — CalendarScreen's task area (the last `.map()`-in-ScrollView holdout) converted to a windowed `SectionList`; all other list screens already used FlatList/SectionList with tuned windowing | Keep new list surfaces virtualized from day one; `getItemLayout` only where row height is fixed. | P1 |
| P-2 | Images | `expo-image` is the standard wrapper; audit confirmed every image uses `cachePolicy="memory-disk"` + explicit `contentFit`, list images add `recyclingKey` | Hold the line on new image call sites. | P2 |
| P-3 | Re-renders | Memoization is broadly in place; `PlantCard` now `React.memo` with id-based stable callbacks; Catalog pickers' per-item `Set` allocation fixed (2026-07-05) | Keep the large `usePlantFormState` from forcing whole-form re-renders (see A-2); spot-check with the React DevTools profiler when adding heavy sections. | P2 |
| P-4 | Firestore reads (free-tier) | `dataCache` has 30s TTL + request dedup; mutations call `invalidate()` | Keep new services on the cache → auth → timeout/retry → AsyncStorage pattern so reads stay servable from cache. Batch writes. Avoid per-item `getDoc` loops — prefer one query + client filter. | P1 |
| P-5 | Cold start | Migration runner now caches the schema version in AsyncStorage — zero Firestore reads + no token refresh on launch once at `LATEST_SCHEMA_VERSION` (2026-07-05) | Defer non-critical Sentry/integration work until after first paint. Measure TTI on a low-end Android device. | P2 |
| P-6 | List data shape | Some screens compute derived status per render | Push derivations (rotation status, attention reasons, capacity bars) into memoized hook selectors so scrolling never recomputes them. | P3 |

---

## 2. Domain / Product for Small Farmers

| # | Area | Current state | Recommendation | Priority |
| - | ---- | ------------- | -------------- | -------- |
| D-1 | Offline writes | ✅ **Done (2026-07-05)** — offline mutation queue shipped: `writeOrQueue()` persists failed user-data writes to AsyncStorage (`offlineQueue.ts`), `offlineSync.ts` replays FIFO on reconnect, `OfflineBanner` surfaces offline state + pending count. See `docs/SERVICES.md` → Offline Write Queue. | Remaining follow-ups: on-device airplane-mode validation; consider surfacing dropped-after-retries mutations to the user. | P1 |
| D-2 | Onboarding | New users land on an empty TodayScreen | Build the guided first-run flow (district select → first plot → first plant/bed). Reuse `BedCreationWizard` patterns. Roadmap **G17 / Phase F**. | P1 |
| D-3 | Tamil i18n | Strings hardcoded in English; `tamilName` data already present | Before Phase G UI work, extract strings to a single message catalog and route through one accessor so the Settings toggle flips the whole app (no language mixing, per CLAUDE.md). Roadmap **G16 / Phase G**. | P2 |
| D-4 | Low-literacy UX | Text-forward screens | Favor icons + color + numbers over prose; large tap targets; confirm-by-icon. Pair with voice input (G10) for the Journal. Validate with a real farmer if possible. | P2 |
| D-5 | Weather-aware care | None | Integrate Open-Meteo (free, no key) for 7-day rain/temp to drive monsoon-aware watering and pre-monsoon prompts (config already exists). Roadmap **G4 / Phase C**. Cache aggressively to respect free-tier and offline. | P2 |
| D-6 | Data portability | Images-only backup | Add full plant/journal/task export+import (JSON or extend the ZIP). Farmers must be able to move/restore their records. Roadmap **G18 / Phase F**. | P2 |
| D-7 | Task reminders | No notifications | Local notifications (`expo-notifications`) for due care tasks — no server, free-tier safe. Respect quiet hours; let users disable. | P3 |
| D-8 | Seasonal adaptation | Config + pre-monsoon batch shipped; screen pending | Finish `SeasonalAdaptationScreen` (B4.5) so per-season frequency changes and pre-monsoon batches are visible, not just data. | P2 |

---

## 3. Architecture / Maintainability

| # | Area | Current state | Recommendation | Priority |
| - | ---- | ------------- | -------------- | -------- |
| A-1 | Firestore coupling | Every service imports `firebase/firestore` directly | Introduce a thin data-access layer (typed `read`/`write`/`query` helpers) so services depend on an interface, not the SDK. Low urgency but compounds. Roadmap **G19**. | P3 |
| A-2 | God hook | `usePlantFormState` returns 120+ properties | Split by concern (identity / care / relationships / safety) or move to a reducer + context so consumers subscribe to slices. Improves both maintainability and P-3 re-renders. | P2 |
| A-3 | Schema discipline | Migration runner + `LATEST_SCHEMA_VERSION` = 4 | Keep following `docs/SCHEMA_MIGRATIONS.md`: required field / reshape → numbered migration + version bump; optional field → `?? fallback`, no migration. Never reshape live data in app code. | P1 |
| A-4 | Service pattern consistency | Most services follow cache → auth → timeout/retry → AsyncStorage | Audit newer services (`farmCapacity`, `backup`) for the full pattern incl. `invalidate()` after mutations; document any intentional deviations. | P2 |
| A-5 | Test depth vs breadth | ~29 files, 30% threshold, utils/config only | Raise coverage thresholds incrementally as the suite grows; add a Firestore **emulator** harness so services/hooks can be tested without mocking Firestore (closes the CLAUDE.md rule #7 gap, currently unenforced in CI). | P2 |
| A-6 | Keep docs in sync | Roadmap had drifted ~6 weeks behind code | After each shipped phase, update the Progress Tracker + add a "delivered" block in the same pass as the feature PR, so the roadmap stays trustworthy. | P2 |

---

## Suggested near-term order

> 2026-07-05: **D-1** (offline mutation queue) and the **P-1/P-3/P-5** performance items shipped —
> see the tables above for what changed.

1. **D-2 / G17** onboarding (first impression, Phase F)
2. **D-8** finish `SeasonalAdaptationScreen` to close out Phase B4
3. **A-5** raise coverage thresholds + emulator harness before the suite ossifies
4. On-device airplane-mode validation of the offline queue (D-1 follow-up)

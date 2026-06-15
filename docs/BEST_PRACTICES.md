# Best Practices — Organic Gardening Planner

> Companion to `docs/IMPLEMENTATION_ROADMAP.md`. Prioritized, actionable recommendations for
> keeping the app well-crafted for **small organic farmers** in Tamil Nadu / Kanyakumari.
> Last reviewed: 2026-06-15. These are recommendations only — each links to the roadmap gap (Gxx)
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
| P-1 | Long lists | Plants / Beds / Calendar / Journal can grow past 20 items | Audit every list against CLAUDE.md "FlatList for 20+ items": ensure `keyExtractor`, stable `renderItem` (no anon functions in JSX — already an ESLint norm), `getItemLayout` where row height is fixed, and `removeClippedSubviews` on the longest lists. Use `windowSize`/`maxToRenderPerBatch` tuning only where a real jank is measured. | P1 |
| P-2 | Images | `expo-image` is the standard wrapper | Confirm every image uses `cachePolicy="memory-disk"` and an explicit `contentFit`/placeholder; device-local images (MediaLibrary) should never re-decode on scroll. | P2 |
| P-3 | Re-renders | Components follow `useMemo(() => createStyles(theme), [theme])` + `useCallback` | Spot-check heavy screens (`TodayScreen`, `CalendarScreen`, `BedDetailScreen`) with the React DevTools profiler; memoize derived lists in hooks rather than in JSX. Keep the large `usePlantFormState` from forcing whole-form re-renders (see A-2). | P2 |
| P-4 | Firestore reads (free-tier) | `dataCache` has 30s TTL + request dedup; mutations call `invalidate()` | Keep new services on the cache → auth → timeout/retry → AsyncStorage pattern so reads stay servable from cache. Batch writes. Avoid per-item `getDoc` loops — prefer one query + client filter. | P1 |
| P-5 | Cold start | Sentry init + auth listener + migration runner all fire on launch | Keep the migration runner cheap when already at `LATEST_SCHEMA_VERSION` (early-return, no reads); defer non-critical Sentry/integration work until after first paint. Measure TTI on a low-end Android device. | P2 |
| P-6 | List data shape | Some screens compute derived status per render | Push derivations (rotation status, attention reasons, capacity bars) into memoized hook selectors so scrolling never recomputes them. | P3 |

---

## 2. Domain / Product for Small Farmers

| # | Area | Current state | Recommendation | Priority |
| - | ---- | ------------- | -------------- | -------- |
| D-1 | Offline writes | `withTimeoutAndRetry()` retries, then **silently fails** | Add an offline mutation queue (persist failed writes to AsyncStorage, replay on reconnect, surface a "pending sync" indicator). This is the single biggest real-world gap for rural connectivity. Roadmap: promote to Critical. | P1 |
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

1. **D-1** offline mutation queue (Critical, real farmer pain)
2. **D-2 / G17** onboarding (first impression, Phase F)
3. **P-1 / P-4** list + Firestore-read performance audit (cheap, broad payoff)
4. **D-8** finish `SeasonalAdaptationScreen` to close out Phase B4
5. **A-5** raise coverage thresholds + emulator harness before the suite ossifies

# Enterprise-Readiness Validation Audit

**Audit date:** 2026-08-01  
**Scope:** React Native + Expo SDK 54 application, Firebase Auth, Firestore rules and data access, local-first cache/outbox, migrations, tests/CI, performance, and operations.  
**Method:** Static review of the repository and Git history, targeted searches, plus full lint, typecheck, Jest, and coverage runs. No application code was changed.

## Executive summary

**Overall enterprise-readiness score: 4.0/10 — not enterprise-ready.** The app has several good foundations (strict TypeScript, client-generated IDs in most domains, timeout/retry coverage, Sentry, error boundaries, a durable offline design, and a green test suite), but the current implementation has release-blocking tenant-isolation and offline-durability defects. In particular, shared-device account changes can expose the previous account's cached content, AsyncStorage failures can silently discard queued writes, and a write enqueued during replay can be removed without ever reaching Firestore.

**Release recommendation:** No-go for enterprise or shared-device production until C-01 through C-03 are remediated and protected by emulator/integration tests. The High findings around Firestore ownership immutability, authentication failure handling, migration gating, unvalidated imports, and missing core-layer tests should be treated as the next release gate.

| Area | Score | Summary |
| --- | ---: | --- |
| 1. Architecture & separation | **4/10** | 16 screens and 11 components import service modules directly; service contracts vary by domain. |
| 2. Security | **3/10** | Remote reads are mostly tenant-isolated, but ownership can be transferred on update, local account data crosses users, runtime validation is absent, and sensitive state is unencrypted. |
| 3. Reliability & offline correctness | **3/10** | The outbox has silent persistence loss, replay/enqueue races, stale overwrites, non-atomic logical operations, and no dead-letter recovery. |
| 4. Data integrity & migrations | **4/10** | Version 4 matches migrations 001–004 and migrations are generally rerunnable, but launch is not gated, failures are swallowed, and migration 001 targets an obsolete shape. |
| 5. Code quality & standards | **4/10** | Lint/typecheck pass, but several critical project rules are not enforced and have widespread violations. |
| 6. Performance & Firestore cost | **5/10** | Major lists are virtualized and some writes are batched, but cold paths fetch full collections and several workflows fan out unbounded reads/writes. |
| 7. Testing & CI | **4/10** | 923 tests pass and CI runs lint/typecheck/coverage on PRs to `main`, but services/hooks/screens are excluded from coverage and no Firestore emulator suite exists. |
| 8. Observability & operations | **5/10** | Sentry and global handlers exist, but production sync failures/drops are not reported and PII scrubbing is incomplete. |

## Validation results

No lint or test failures occurred, so there is no failure output to reproduce. The exact command summaries were:

```text
> organic-gardening-app@1.1.0 lint
> eslint . --ext .js,.jsx,.ts,.tsx

Exit code: 0
```

```text
> organic-gardening-app@1.1.0 test
> jest --runInBand

Test Suites: 78 passed, 78 total
Tests:       923 passed, 923 total
Snapshots:   3 passed, 3 total
Time:        119.432 s, estimated 191 s
Ran all test suites.
```

Supplemental typecheck:

```text
> organic-gardening-app@1.1.0 typecheck
> tsc --noEmit

Exit code: 0
```

Coverage run:

```text
All files | 73.64 % statements | 63.96 % branches | 72.24 % functions | 73.33 % lines
Test Suites: 78 passed, 78 total
Tests:       923 passed, 923 total
```

The overall coverage number is not representative of the application because `jest.config.js:15-23` instruments only `src/utils` and `src/config`.

## Findings — Critical

### C-01 — Shared local state and the offline queue cross authenticated accounts

- **Severity:** Critical
- **Locations:** `src/lib/storage.ts:6-20`, `src/types/offline.types.ts:12-29`, `src/screens/MoreScreen.tsx:33-36`, `App.tsx:286-318`, `App.tsx:360-384`, `src/screens/TodayScreen.tsx:151-164`, `src/services/plants.ts:219-222`, `src/services/tasks.ts:1108-1139`, `src/services/farmCapacity.ts:154-168`, `src/services/offlineSync.ts:74-87`.
- **Why it matters:** All substantive caches and `@garden_offline_queue` are global; only locations have a UID-key helper. Sign-out invalidates RAM but does not clear or switch persisted state. Account B on the same device can render account A's plants, tasks, logs, farm configuration, and profiles. Account B also triggers replay of account A's pending mutations, which then block FIFO and can be discarded after permission failures.
- **Recommended remediation:** Namespace every cache/outbox by UID, store `ownerUid` on each mutation, atomically switch state on every auth transition, and reject mismatched replay.

### C-02 — Offline-queue persistence reports success after AsyncStorage failure

- **Severity:** Critical
- **Locations:** `src/utils/safeStorage.ts:72-105`, `src/utils/safeStorage.ts:121-149`, `src/lib/storage.ts:36-41`, `src/lib/offlineQueue.ts:59-77`, `src/lib/offlineQueue.ts:83-103`.
- **Why it matters:** `safeSetData()` returns `false` after exhausted writes, but `setData()` ignores the result; enqueue/removal then logs and notifies success. Exhausted reads return an empty array, and malformed JSON is deleted. An offline write can therefore vanish while the UI says it was saved, or a committed mutation can remain and replay repeatedly if removal was not persisted.
- **Recommended remediation:** Make outbox reads/writes fail closed, propagate durability failure, verify persistence before acknowledgement, and quarantine corrupt data rather than deleting it.

### C-03 — A newer edit can be deleted by an in-flight replay

- **Severity:** Critical
- **Locations:** `src/services/offlineSync.ts:74-87`, `src/utils/offlineQueueLogic.ts:98-115`, `src/lib/offlineQueue.ts:59-75`, `src/lib/offlineQueue.ts:83-89`.
- **Why it matters:** Replay snapshots the queue and executes outside the queue lock. A concurrent same-document enqueue coalesces into the persisted entry while preserving its old ID; when the old executor returns, `removeMutation(oldId)` removes the newly merged payload. A create followed by delete during replay can create the remote document and silently lose the delete.
- **Recommended remediation:** Add entry revisions and compare-and-swap removal or an in-flight lease, and never coalesce a new mutation into an executing revision.

## Findings — High

### H-01 — Firestore document ownership is mutable during update

- **Severity:** High
- **Locations:** `firestore.rules:8-10`, `firestore.rules:18-40`, `src/services/plants.ts:526-549`, `src/services/tasks.ts:213-248`, `src/services/journal.ts:197-250`.
- **Why it matters:** Update authorization checks only the old `resource.data.user_id`; it never requires `request.resource.data.user_id` to remain the authenticated UID. An owner can transfer/inject a plant, task, log, journal entry, or bed into another user's queryable dataset. The update APIs also accept and spread ownership-bearing partial objects.
- **Recommended remediation:** Require new ownership to equal both the authenticated UID and existing owner, and reject immutable/system fields at service boundaries.

### H-02 — Authoritative input and schema validation is absent

- **Severity:** High
- **Locations:** `firestore.rules:13-45`, `src/services/beds.ts:92-136`, `src/services/plants.ts:402-432`, `src/services/journal.ts:144-175`, `src/services/tasks.ts:174-191`, `src/utils/backupManifest.ts:80-101`.
- **Why it matters:** Firestore Rules enforce ownership but not allowed keys, types, enums, ranges, timestamp shapes, string/list sizes, or immutable fields. Service boundaries spread typed values directly, and backup validation casts array members without validating records. TypeScript and screen validation are bypassable client-side controls; malformed or abusive documents can corrupt data and consume shared quota.
- **Recommended remediation:** Apply shared runtime schemas to every create/update/import and mirror allowed-key, type, size, range, and immutability constraints in Firestore Rules.

### H-03 — Revoked or expired sessions are masked as offline success

- **Severity:** High
- **Locations:** `src/lib/firebase.ts:108-141`, `src/services/journal.ts:107-140`, `src/services/tasks.ts:106-109`, `src/services/beds.ts:66-69`, `src/services/plants.ts:180-205`, `src/services/farmCapacity.ts:208-230`, `src/services/locations.ts:171-195`, `src/services/plantProfiles.ts:975-997`.
- **Why it matters:** `refreshAuthToken()` returns `false`, but callers ignore it. Broad read catches turn permission/unauthenticated failures into cached success, while several settings writes catch remote errors and return apparent success. A revoked user can remain in an inconsistent authenticated UI rather than being forced to reauthenticate.
- **Recommended remediation:** Throw typed auth failures, permit local fallback only for offline/`unavailable` errors, and route authentication failures through centralized sign-out/reauthentication.

### H-04 — Authentication state and user content are stored unencrypted

- **Severity:** High
- **Locations:** `src/lib/firebase.ts:47-60`, `src/lib/storage.ts:6-20`, `src/utils/safeStorage.ts:121-135`, `src/lib/offlineQueue.ts:59-75`, `package.json:41`.
- **Why it matters:** Firebase session material, journals, locations, task history, farm/profile data, and queued mutation payloads reside in raw AsyncStorage. This increases exposure through compromised devices, backup extraction, rooted/jailbroken access, or forensic recovery; `expo-secure-store` is installed but unused for these values.
- **Recommended remediation:** Use keychain/keystore-backed authentication persistence and encrypted, UID-scoped storage for user content and queued payloads.

### H-05 — Screens and components bypass hooks and call services/Auth directly

- **Severity:** High
- **Locations:** Representative data paths are `src/screens/TodayScreen.tsx:119-164`, `src/screens/TodayScreen.tsx:293-303`, `src/screens/CalendarScreen.tsx:483-505`, `src/screens/JournalFormScreen.tsx:348-369`, `src/screens/PlantsScreen.tsx:143-161`, `src/components/BedContextSection.tsx:24-32`, `src/components/PlantEntryResolverSheet.tsx:83-95`, `src/components/modals/CreateTaskModal.tsx:115-157`; direct Auth calls are at `src/screens/AuthScreen.tsx:4`, `src/screens/AuthScreen.tsx:66-69`, `src/screens/MoreScreen.tsx:8`, `src/screens/MoreScreen.tsx:33-36`.
- **Why it matters:** Static inventory found service imports in 16 screen files and 11 component files. Loading, authorization, cache, validation, and error behavior is duplicated in UI code, preventing consistent enforcement and making UI tests dependent on data-layer details.
- **Recommended remediation:** Route all UI data/auth operations through focused hooks; keep services as the sole data/auth boundary.

### H-06 — The sole `addDoc` create can duplicate records under timeout/retry

- **Severity:** High
- **Locations:** `src/services/BedTaskResolver.ts:3`, `src/services/BedTaskResolver.ts:151-153`, `src/utils/firestoreTimeout.ts:41-74`, `src/lib/offlineWrite.ts:17-20`.
- **Why it matters:** `addDoc()` is retried even though a local timeout does not cancel the original Firestore operation. A server success followed by client timeout can produce a second task ID. Generated timeout errors are also not classified for offline queuing, creating ambiguous failed/succeeded UI states.
- **Recommended remediation:** Allocate `doc(collection(...))` once, retry idempotent `setDoc()` against that stable ID, and classify transient deadlines explicitly.

### H-07 — “Clear cache” permanently deletes unsynced writes

- **Severity:** High
- **Locations:** `src/lib/storage.ts:59-65`, `src/screens/SettingsScreen.tsx:198-212`.
- **Why it matters:** `clearAllData()` clears every storage key, including `OFFLINE_QUEUE`, while the UI promises “Your data will not be deleted.” For offline changes, that queue can be the only durable copy.
- **Recommended remediation:** Exclude the outbox from cache clearing and require explicit flush/export/discard handling when pending writes exist.

### H-08 — Offline logical transactions can partially commit and dropped writes leave phantom state

- **Severity:** High
- **Locations:** `src/services/tasks.ts:629-660`, `src/services/offlineSync.ts:84-127`, `App.tsx:370-376`.
- **Why it matters:** An online task-completion batch becomes separate log/template/plant queue entries offline. Replay commits them independently and can pause/drop midway. After five non-network failures, the mutation is removed; cache invalidation happens only when `synced > 0`, App ignores `FlushResult`, and optimistic AsyncStorage is not rolled back. Users can see a task log without its due-date/plant update or data that never reached the server.
- **Recommended remediation:** Persist transaction-group metadata and replay each group atomically, retain dead-letter entries, surface recovery, and reconcile affected local records on permanent failure.

### H-09 — Stale queued and multi-device edits overwrite newer data without conflict detection

- **Severity:** High
- **Locations:** `src/lib/offlineWrite.ts:27-44`, `src/types/offline.types.ts:12-29`, `App.tsx:365-377`, `src/services/offlineSync.ts:32-49`, `src/services/offlineSync.ts:84-87`.
- **Why it matters:** A successful online write does not reconcile an older same-document queued mutation, so the later flush can regress the online edit. Across devices, entries carry no base revision/precondition and unconditional last-arrival-wins operations silently overwrite newer configuration, location, or profile data.
- **Recommended remediation:** Serialize writes through a revisioned outbox, remove/merge older queued revisions before online commits, and use server revisions/preconditions with an explicit conflict policy.

### H-10 — A filtered task-log read corrupts the full offline history cache

- **Severity:** High
- **Locations:** `src/services/tasks.ts:944-987`, `src/services/tasks.ts:1008-1010`.
- **Why it matters:** `getTaskLogs(templateId)` fetches one template's logs but unconditionally replaces the shared `KEYS.TASK_LOGS`. Unrelated history then disappears from offline views and from local consumers such as cascades; the adjacent plant-scoped path explicitly preserves this full-cache invariant.
- **Recommended remediation:** Replace the full key only after unfiltered reads; merge filtered results by ID or use partitioned cache keys.

### H-11 — Cache invalidation can be undone by an older in-flight read

- **Severity:** High
- **Locations:** `src/lib/dataCache.ts:53-56`, `src/lib/dataCache.ts:90-109`.
- **Why it matters:** `invalidate()` deletes a value but does not cancel/version the pending request. An older request completing after a mutation sees no current entry and stores its stale pre-mutation result, making a delete/update appear to reverse in memory.
- **Recommended remediation:** Maintain per-key generations and discard fetch results whose generation predates invalidation.

### H-12 — Farm configuration never revalidates after any AsyncStorage value exists

- **Severity:** High
- **Locations:** `src/services/farmCapacity.ts:154-184`.
- **Why it matters:** The service returns the persisted value before reaching the authenticated Firestore branch and refreshes the memory cache from it on every call. Cross-device edits and server-side repairs remain invisible indefinitely.
- **Recommended remediation:** Use UID-scoped, versioned stale-while-revalidate storage instead of treating AsyncStorage as permanently authoritative.

### H-13 — Migrations do not gate rendering and migration failures resolve successfully

- **Severity:** High
- **Locations:** `App.tsx:294-313`, `src/migrations/index.ts:69-75`, `src/migrations/index.ts:89-104`.
- **Why it matters:** Authentication loading ends before `runPendingMigrations()` starts. The runner returns on schema-read failure and catches/breaks migration failure without rethrowing, so App's `.catch()` cannot act. Screens can execute against an old shape while a migration is running or after it failed.
- **Recommended remediation:** Await migrations behind the launch gate and propagate a structured failure that blocks startup or schedules visible recovery.

### H-14 — Migration 001 writes a schema location the app no longer reads

- **Severity:** High
- **Locations:** `src/migrations/001_backfill_district.ts:14-28`, `src/services/farmCapacity.ts:13-14`, `src/services/farmCapacity.ts:178-184`.
- **Why it matters:** Migration 001 writes top-level `district`/`zone_id`, while runtime code reads the nested `farmConfig` object. Legacy users are marked migrated but continue receiving fallback district/zone behavior, which can affect weather and care recommendations.
- **Recommended remediation:** Ship a new repair migration that populates `farmConfig` while preserving existing data; do not rewrite the already-issued migration.

### H-15 — Backup restore can bypass migrations and leave a mixed dataset

- **Severity:** High
- **Locations:** `src/utils/backupManifest.ts:48`, `src/utils/backupManifest.ts:80-101`, `src/services/backup.ts:419-437`, `src/services/backup.ts:518-570`.
- **Why it matters:** Older/missing schema versions and unvalidated record members are accepted; arrays are cached and merge-written under supplied IDs. Records absent from a “replacement” backup are not deleted, and local/settings/remote phases have no rollback/checkpoint. An account already marked schema v4 can end with legacy, malformed, or partially restored data.
- **Recommended remediation:** Fully validate and migrate a staged manifest before writes, then perform checkpointed replacement with an explicit absent-record policy.

### H-16 — Cold entity workflows perform unbounded full-collection billed reads

- **Severity:** High
- **Locations:** `src/services/tasks.ts:130-153`, `src/hooks/usePlantDetail.ts:43-70`, `src/services/journal.ts:399-420`, `src/services/tasks.ts:328-380`.
- **Why it matters:** `getTodayTasks()` reads every enabled task and filters due dates locally. Plant Detail loads every task and journal entry before filtering one plant, and a plant cascade loads user-wide task templates/logs. Cost and latency grow with lifetime account history and threaten the Firestore free tier.
- **Recommended remediation:** Add indexed, paginated due-date and per-plant queries, and query cascade targets directly or derive them from a confirmed fresh full cache.

### H-17 — Multi-document paths use unbounded or sequential individual writes

- **Severity:** High
- **Locations:** `src/screens/BedPlantPickerScreen.tsx:67-74`, `src/hooks/useBedCreationWizard.ts:816`, `src/screens/CalendarScreen.tsx:831`, `src/services/tasks.ts:1458`, `src/services/BedTaskResolver.ts:125-155`, `src/migrations/004_backfill_lifecycle_type.ts:35-45`.
- **Why it matters:** At least six workflows fan out service calls or Firestore writes via sequential loops/unbounded `Promise.all`. They repeat ownership reads, writes, rereads, and cache updates; partial completion is possible and large accounts can burst network/quota limits.
- **Recommended remediation:** Plan mutations first, commit bounded `writeBatch` chunks through the offline-capable path, and update caches once per logical operation.

### H-18 — Core data layers, Firestore Rules, and migrations have no measurable integration coverage

- **Severity:** High
- **Locations:** `jest.config.js:15-30`, `src/__tests__/services/offlineSync.test.ts:1-4`, `src/__tests__/services/offlineSync.test.ts:28-42`, `docs/TESTING.md:6-11`, `docs/SCHEMA_MIGRATIONS.md:24`.
- **Why it matters:** Coverage instruments only utils/config. Services, hooks, and screens are unmeasured; no `src/__tests__/migrations` suite exists. There is no Firebase emulator/rules harness, and offline-sync tests intentionally bypass the default Firestore executor with an injected executor and mocked application adapters. Tenant rules, real timeout behavior, atomic writes, migrations, and persistence failures are therefore unverified.
- **Recommended remediation:** Add Firebase Auth/Firestore/Rules emulator integration tests, instrument all production layers, and enforce per-layer thresholds plus migration rerun/crash tests in CI.

### H-19 — Production telemetry cannot diagnose a sync failure or dropped write

- **Severity:** High
- **Locations:** `src/utils/logger.ts:27`, `src/services/offlineSync.ts:91-119`, `App.tsx:128-132`, `App.tsx:370-376`.
- **Why it matters:** The logger is disabled in production, replay failures/drops use only `logger.warn`, common network/timeouts are ignored by Sentry, and App discards the flush result. The queue badge disappears after a drop, leaving support without mutation ID, document, retry/error code, account, or incident correlation.
- **Recommended remediation:** Emit redacted structured Sentry events/metrics for enqueue/replay/retry/drop/recovery and show a support-safe incident ID and dead-letter status.

## Findings — Medium

### M-01 — Aggregate rename/domain persistence logic lives in a screen

- **Severity:** Medium
- **Locations:** `src/screens/CatalogPlantDetailScreen.tsx:508-575`.
- **Why it matters:** The screen sequentially renames linked plants, constructs a profile, mutates its keyed map, and persists it. A mid-loop failure leaves partially renamed instances and profile mismatch.
- **Recommended remediation:** Move the aggregate command into an idempotent service using batched/transactional persistence and expose it through a hook.

### M-02 — Public services do not consistently implement the documented pipeline

- **Severity:** Medium
- **Locations:** Creates omit refresh at `src/services/plants.ts:402-432`, `src/services/journal.ts:144-175`, and `src/services/tasks.ts:174-191`; reads omit memory cache and/or refresh at `src/services/beds.ts:74-88`, `src/services/beds.ts:169-187`, `src/services/plants.ts:344-395`, and `src/services/tasks.ts:1057-1079`; `src/services/locations.ts:121-135` writes directly from a read path.
- **Why it matters:** Authentication, cache freshness, offline, fallback, and failure semantics vary across domains, making behavior difficult to reason about and increasing production-only defects.
- **Recommended remediation:** Centralize and enforce cache → auth → timeout/retry or queue → cache/store behavior for every public data operation.

### M-03 — Duplicate one-shot completion skips local cache maintenance

- **Severity:** Medium
- **Locations:** `src/services/tasks.ts:821-839`.
- **Why it matters:** The duplicate branch disables the template remotely (or queues it) and returns without patching AsyncStorage or invalidating task caches, so the same one-shot task can remain visible/enabled locally.
- **Recommended remediation:** Patch `KEYS.TASKS` and invalidate the task caches before returning.

### M-04 — Service AsyncStorage read-modify-write sequences are not atomic

- **Severity:** Medium
- **Locations:** `src/lib/offlineQueue.ts:59-75`, `src/services/plants.ts:443-448`, `src/services/journal.ts:187-192`.
- **Why it matters:** The storage wrapper serializes individual reads/writes, not a service's entire update sequence. Concurrent optimistic creates can read the same array and last-write-wins one record out of the local cache.
- **Recommended remediation:** Expose per-key transactional update locks and use them for every persisted collection mutation.

### M-05 — Normal updates and orphan healing amplify billed reads

- **Severity:** Medium
- **Locations:** `src/services/plants.ts:76`, `src/services/plants.ts:534-558`, `src/services/tasks.ts:226-262`, `src/services/journal.ts:211-262`, `src/hooks/useCalendarData.ts:150`, `src/services/plants.ts:389-397`.
- **Why it matters:** Common edits perform ownership read → write → reread, and orphan healing issues one query per missing plant in unbounded parallelism. Bulk operations multiply those reads and latency hops.
- **Partially resolved:** the orphan-healing half is gone. `useCalendarData` no longer runs per-plant `plantExists()` round-trips or hard-deletes on a Care Plan load — it only hides orphaned rows — so that read amplification and its `plants.ts` helper have been removed. The ownership read → write → reread amplification on normal edits still stands.
- **Recommended remediation:** Use immutable-owner rules plus trusted UID-scoped local records, optimistic merges, and chunked ID queries; reread only server-derived fields.

### M-06 — Several user-sized lists do not virtualize and one picker defeats virtualization

- **Severity:** Medium
- **Locations:** `src/components/PlantEntryResolverSheet.tsx:147-206`, `src/components/BedRotationView.tsx:55-126`, `src/components/BedsQuickScroll.tsx:67-74`, `src/components/BedPlantPickerSheet.tsx:287-298`.
- **Why it matters:** `ScrollView + map` mounts all rows after an account passes 20 plants/beds. The picker nests a non-scrolling `FlatList`, defines `renderItem` inline, and filters all current entries for every row, creating O(plants × entries) render work.
- **Recommended remediation:** Use a primary virtualized list, stable/memoized row renderers, and precomputed lookup maps.

### M-07 — Critical project standards are not enforced and are widely violated

- **Severity:** Medium
- **Locations:** `eslint.config.cjs:31-48`, `package.json:11`, explicit `any` examples at `src/components/ThemedDropdown.tsx:29`, `src/utils/safeStorage.ts:13`, `src/utils/dateHelpers.ts:14`; representative relative imports at `src/components/CollapsibleSection.tsx:4-5` and `src/components/calendar/SwipeableTaskCard.tsx:4-14`.
- **Why it matters:** `no-explicit-any` is only a warning, lint does not use `--max-warnings=0`, and no rule enforces alias-only imports, console isolation, forbidden Firebase Storage/`terminate()`, or JSX callback stability. Static inventory found 618 production relative imports across 149 files and 364 anonymous JSX callbacks across 72 files.
- **Recommended remediation:** Encode every critical rule as an ESLint error, fail on warnings, and add restricted-import/call and JSX callback rules.

### M-08 — Inline styles and runtime color literals remain widespread

- **Severity:** Medium
- **Locations:** Representative inline styles at `src/screens/CalendarScreen.tsx:1541` and `src/components/ThemedDropdown.tsx:224`; representative color literals at `src/screens/SettingsScreen.tsx:294`, `src/components/PlantCard.tsx:72-80`, and `src/components/CollapsibleSection.tsx:72`.
- **Why it matters:** Static inventory found at least 137 inline style objects across 58 files and 85 runtime color literals outside the theme across 21 files. This fragments dark mode/accessibility behavior and allocates new objects on render hot paths.
- **Recommended remediation:** Move styles into theme-backed factories and replace literals with named theme tokens.

### M-09 — Telemetry PII redaction is shallow

- **Severity:** Medium
- **Locations:** `src/utils/errorLogging.ts:23-48`, `src/utils/errorTracker.ts:86-99`, `App.tsx:70-116`.
- **Why it matters:** Only top-level context key names are checked; user ID is added after sanitization; nested context, messages, and stacks pass to Sentry. `beforeSend` scrubs two headers and email but not arbitrary nested PII or sensitive values embedded in strings.
- **Recommended remediation:** Use recursive allow-listing/pseudonymization and sanitize messages, stacks, breadcrumbs, persisted context, and nested values before export.

### M-10 — Local error history can overwrite prior-session diagnostics

- **Severity:** Medium
- **Locations:** `src/utils/errorTracker.ts:31-44`, `src/utils/errorTracker.ts:49-80`.
- **Why it matters:** `trackError()` does not initialize persisted history before appending/writing, and no production path initializes the tracker first. The first error after process start can overwrite earlier diagnostics; the support export is not surfaced.
- **Recommended remediation:** Initialize lazily inside `trackError()`, serialize writes, and expose a redacted support bundle.

### M-11 — Fire-and-forget promises still have unhandled rejection paths

- **Severity:** Medium
- **Locations:** `src/services/plantProfiles.ts:926-950`, `src/components/BedContextSection.tsx:24-32`, `src/hooks/useBedCreationWizard.ts:447-455`, `src/utils/networkState.ts:47-51`; global observation is at `App.tsx:162-183`.
- **Why it matters:** Several background/async paths are invoked without terminal catches, and a token refresh occurs outside a service try block. Global rejection tracking observes errors but does not make the promises handled; runtime behavior can vary and failures can bypass intended UI recovery.
- **Recommended remediation:** Catch every fire-and-forget promise and enforce `no-floating-promises` with explicit `void ...catch(...)` handling.

## Findings — Low

### L-01 — Optional harvest fields can render as `undefined`

- **Severity:** Low
- **Locations:** `src/types/database.types.ts:688-689`, `src/components/HarvestHistorySection.tsx:123-135`.
- **Why it matters:** Legacy entries without optional quantity/unit fields can expose incomplete text and reduce confidence in migrated records.
- **Recommended remediation:** Normalize display values with explicit `??` fallbacks.

### L-02 — Zero-valued optional coconut metrics hide the section

- **Severity:** Low
- **Locations:** `src/types/database.types.ts:597-601`, `src/components/CoconutSection.tsx:32-49`.
- **Why it matters:** The inner logic recognizes zero, but outer visibility uses truthiness, so valid zero counts can be treated as missing data.
- **Recommended remediation:** Base visibility on nullish/presence checks rather than truthiness.

### L-03 — Error records report the wrong application version

- **Severity:** Low
- **Locations:** `src/utils/errorTracker.ts:65`, `package.json:4`.
- **Why it matters:** Local diagnostics record `1.0.0` while the app is `1.1.0`, making incident/release correlation unreliable.
- **Recommended remediation:** Read release/version/build metadata from Expo Constants or the Sentry release configuration.

### L-04 — A >800-line generated snapshot is absent from CODEMAP warnings

- **Severity:** Low
- **Locations:** `src/__tests__/utils/__snapshots__/dataRegistrySnapshot.test.ts.snap:1`, `docs/CODEMAP.md:1-8`.
- **Why it matters:** The snapshot is 11,522 lines but is absent from the generated inventory/warnings. All non-generated production files over 800 lines are already listed, so this is a codemap completeness issue rather than a production maintainability defect.
- **Recommended remediation:** List large snapshots or explicitly document/exempt generated artifacts in the codemap generator.

## Offline replay behavior matrix

| Scenario | Current behavior | Assessment |
| --- | --- | --- |
| Partial replay failure | Successful prefix entries are removed; offline loss pauses without a strike; other errors pause and increment; fifth failure is dropped and replay continues. | FIFO for a fixed snapshot is reasonable, but logical multi-document operations lose atomicity and permanent drops have no recovery (H-08). |
| Duplicate replay | Stable-ID `set`/`update`/`delete` payloads are mostly idempotent, but failed removal persistence repeats them; `addDoc` retries can duplicate records. | At-least-once behavior is not explicitly modeled or observed (C-02, H-06). |
| Out-of-order/concurrent replay | Concurrent flush callers share one promise, but enqueue can mutate the persisted entry while its older revision executes. | A normal reconnect/edit race can lose the new revision (C-03). |
| Same-device stale edit | An old queued mutation can remain after a newer online write and replay later. | Newer state can regress (H-09). |
| Two-device conflict | No base revision or precondition; last server arrival wins. | Silent data loss under concurrent edits (H-09). |
| Different signed-in user | Queue has no UID and replay runs under whichever account is current. | Cross-account contamination, FIFO blockage, and eventual loss (C-01). |

## Data-integrity and migration verification

- `LATEST_SCHEMA_VERSION = 4` exactly matches migration files and registry entries 001–004 at `src/migrations/index.ts:15-22`.
- The migrations are generally data-idempotent: 001 checks existing fields, 002 deterministically normalizes enrichment, 003 skips an existing consolidated profile, and 004 updates only plants missing `lifecycle_type`. The runner records each version only after `run()` resolves at `src/migrations/index.ts:92-94`.
- A mid-migration crash should rerun the current migration. Migration 004's per-document filter makes partial reruns safe, although its unbounded `Promise.all` is included in H-17.
- Git-history review found no post-baseline required persisted-field addition without a migration; recent persisted additions are optional. Persisted bed reads have explicit fallbacks at `src/services/bedLogic.ts:23-59`, and plant reads use nullish defaults in core paths. L-01/L-02 are the concrete unsafe optional-display cases found.
- The two material migration defects are operational rather than version-count defects: startup is not gated (H-13) and migration 001 populates the wrong active shape (H-14).

## Test coverage by layer

The target is “30% on first merge, growing to 70%” at `docs/TESTING.md:11`.

| Layer | Source files | Test files | Measured line coverage | Target assessment |
| --- | ---: | ---: | ---: | --- |
| Services | 18 | 7 | **N/A — excluded** | Cannot demonstrate 30% or 70%; service tests mostly exercise extracted pure logic. |
| Hooks | 28 | 3 | **N/A — excluded** | Cannot demonstrate target; tests cover validation helpers, not hook lifecycle/integration. |
| Utils | 60 | 51 | **71.88%** | Meets the 70% growth target for the instrumented utility layer. |
| Screens | 28 | 0 | **N/A — excluded** | No screen test files and no measurable coverage. |

The configured aggregate is 73.33% lines, but it represents only utils/config. It must not be used as an enterprise application coverage claim.

### Five highest-risk untested paths

1. **Real offline persistence/replay/default executor and reconnect races** — `src/lib/offlineWrite.ts:27-44`, `src/services/offlineSync.ts:32-54`, `src/services/offlineSync.ts:74-127`; the current test explicitly does not exercise the default executor at `src/__tests__/services/offlineSync.test.ts:1-4`.
2. **Migration runner plus migrations 001–004 under rerun/mid-crash conditions** — `src/migrations/index.ts:61-106`; no `src/__tests__/migrations/` directory exists.
3. **Firestore Rules tenant isolation and immutable ownership** — `firestore.rules:8-45`; no Rules emulator harness or `@firebase/rules-unit-testing` dependency/configuration exists.
4. **Shared-device auth transition, cache switching, and UID-bound outbox replay** — `App.tsx:286-318`, `App.tsx:360-384`, `src/screens/MoreScreen.tsx:33-36`.
5. **Backup import/restore validation and failure recovery** — `src/utils/backupManifest.ts:80-101`, `src/services/backup.ts:419-437`, `src/services/backup.ts:518-570`.

### CI verification

`.github/workflows/ci.yml:3-7` runs for pull requests targeting `main`; lint runs at `:29-30`, typecheck at `:32-33`, and Jest coverage at `:35-36`. Therefore lint and tests are configured on every PR to the repository's main integration branch. Repository files cannot prove that branch protection marks this workflow as a required check. The material CI gap is that coverage excludes core layers and CI starts no Firebase emulator.

## Verified controls and positive evidence

- No screen/component imports Firestore directly; Firestore network access remains in services, libraries, and migrations. The architecture breach is UI → service rather than UI → Firestore.
- Rules deny unauthenticated access and direct access to an existing document owned by another user; `user_settings/{uid}` is path-isolated at `firestore.rules:43-45`. H-01 is the update ownership-transfer gap.
- No committed secret was found. `.env` is ignored at `.gitignore:33-35`, `.env.example:3-16` contains placeholders, and Firebase config is read from environment variables at `src/lib/firebase.ts:22-42`. The tracked Sentry client DSN is public client configuration, not an auth token.
- Core creates preallocate IDs: beds at `src/services/beds.ts:108-112`, plants at `src/services/plants.ts:428-432`, journal at `src/services/journal.ts:171-175`, task templates at `src/services/tasks.ts:187-191`, and task logs at `src/services/tasks.ts:536`. H-06 is the sole `addDoc` exception.
- No production Firestore network operation was found outside `withTimeoutAndRetry()`, `writeOrQueue()`, or a wrapped batch commit. Replay is wrapped at `src/services/offlineSync.ts:39-53`.
- No Firebase Storage import/API usage and no Firestore `terminate()` call were found.
- No production `console.*` call exists outside the logger implementation. CLI scripts use console output.
- Strict TypeScript and `noUncheckedIndexedAccess` are enabled at `tsconfig.json:4-5`.
- All 12 `expo-image` render sites specify `cachePolicy="memory-disk"`; reference examples are `src/components/ReferenceThumb.tsx:40`, `src/components/reference/ReferenceListCard.tsx:42`, and `src/components/reference/ReferenceHero.tsx:65`.
- Primary high-cardinality screens use virtualization: Calendar `SectionList` at `src/screens/CalendarScreen.tsx:1448`, Plants `FlatList` at `src/screens/PlantsScreen.tsx:809`, Journal at `src/screens/JournalScreen.tsx:381`, Beds at `src/screens/BedListScreen.tsx:460`, and Archived Plants at `src/screens/ArchivedPlantsScreen.tsx:349`.
- Root crash reporting exists: Sentry initializes at `App.tsx:50`, native/global/rejection handlers are at `App.tsx:144-183`, `ErrorBoundary` wraps the tree at `App.tsx:411-420`, and `Sentry.wrap` is at `App.tsx:429`.
- All non-generated production files over 800 lines are already flagged in `docs/CODEMAP.md`.

## Prioritized remediation roadmap

### Quick wins / immediate release gates

1. **P0 — Close remote ownership transfer:** make `user_id` immutable in Rules and service update allowlists; add Rules emulator tests.
2. **P0 — Stop silent outbox loss:** propagate AsyncStorage failures, fail closed on corrupt reads, and never acknowledge enqueue/removal without durable persistence.
3. **P0 — Prevent replay/edit loss:** add entry revisions/CAS or an in-flight lease before allowing edits during replay.
4. **P0 — Protect account boundaries:** refuse mismatched queue replay immediately; block account switch/sign-out when writes are pending until the user chooses flush/export/discard.
5. **P0 — Remove `addDoc`:** preallocate the bed-task document ID and use idempotent `setDoc()`.
6. **P0 — Fix cache correctness:** stop filtered task-log replacement, add cache generations, and preserve the outbox during cache clearing.
7. **P1 — Make auth failures explicit:** treat unauthenticated/permission failures separately from offline fallback and force reauthentication.
8. **P1 — Gate migrations:** await the runner, propagate failure, ship a new repair migration for nested `farmConfig`, and add migration tests.
9. **P1 — Add sync telemetry:** report retries/drops/dead letters with redacted structured context and a user-visible support ID.
10. **P1 — Tighten lint now:** make `any` an error, fail on warnings, and add restricted rules for imports, forbidden Firebase APIs, colors/styles, and floating promises.

### Structural work

1. **Per-user encrypted local architecture:** UID-namespace every cache/outbox, move secrets/session material to keychain/keystore-backed persistence, and define secure account-transition semantics.
2. **Revisioned offline protocol:** serialize online/offline writes through one outbox, group logical transactions, support idempotency/dead letters, and implement revision/precondition-based conflict handling.
3. **Authoritative schemas:** share runtime validators between service/import boundaries and Firestore Rules; version and migrate backup payloads before mutation.
4. **UI/data separation:** move all data/auth orchestration into hooks, move aggregate business commands into services, and keep screens/components presentation-focused.
5. **Cost-aware query model:** introduce indexed/paginated due-date and entity-scoped queries, eliminate ownership/readback amplification, and batch bounded multi-document workflows.
6. **Core-layer test program:** add Auth/Firestore/Rules emulator suites, migration fault-injection tests, offline concurrency/persistence tests, hook tests, and representative screen tests; instrument and enforce per-layer thresholds toward 70%.
7. **Operational supportability:** preserve redacted diagnostic history across sessions, expose a support bundle, establish sync health metrics/alerts, and correlate Sentry release/build/user-safe incident IDs.
8. **Performance/standards cleanup:** virtualize remaining user-sized lists, stabilize hot-path callbacks/renderers, remove inline styles/colors/`any`, replace relative imports, and split the already-flagged oversized modules over time.

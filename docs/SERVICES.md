# Service Layer & Data Architecture

## Firebase Rules

- **Auth**: Email/password only. Token refresh every 50 minutes (tokens expire at 60 min).
- **Firestore**: Text data only (no binary blobs). Images stored in device MediaLibrary.
- **No Firebase Storage**: Keeps the app within the free tier.
- Prefer batch writes for multi-document mutations.

---

## Active Firestore Shape

- `plants`: plant metadata and stored image filename.
- `task_templates`: recurring care schedule records.
- `task_logs`: completion history.
- `journal_entries`: journal text, stored image filenames, optional `tags: string[]`.
- `user_settings/{uid}`: per-user settings payloads for:
  - `locations`
  - `plantCatalog`
  - `plantCareProfiles`
  - `schema_version` (integer, tracks applied migrations)
  - `district`, `zone_id` (agro-climatic zone linkage)

All app data is scoped by `user_id` or the authenticated user's settings document.

---

## Service Layer Conventions

Keep Firestore and cache logic inside `src/services/*`. Typical service flow:

1. Check `auth.currentUser`.
2. Refresh auth with `refreshAuthToken()` before important reads.
3. Wrap Firestore operations with `withTimeoutAndRetry()` where practical.
4. Convert Firestore `Timestamp` values to ISO strings for app models.
5. Update AsyncStorage caches through `getData()` and `setData()`.
6. Fall back to cached data for read failures.

Every public service function must:

1. Check in-memory cache (return if fresh, <30s).
2. Refresh auth token before Firestore calls.
3. Apply 15s timeout + 2 retries for network requests.
4. Update AsyncStorage and in-memory cache on success.
5. Fall back to AsyncStorage on network failure (reads) or queue the mutation (writes — see Offline Write Queue below).

Return typed data; never return `any`. Log errors to Sentry with context. Mask PII.

Prefer existing service modules over duplicating Firestore access from screens.

### Write path (offline-capable)

User-data writes go through `writeOrQueue()` from `src/lib/offlineWrite.ts` instead of calling
`withTimeoutAndRetry(firestoreOp)` directly:

```ts
const docRef = doc(collection(db, PLANTS_COLLECTION)); // client-generated id, works offline
const { queued } = await writeOrQueue(
  { collection: PLANTS_COLLECTION, docId: docRef.id, op: 'create', payload: newPlant },
  () => setDoc(docRef, newPlant)
);
// …then run the cache update (invalidate() + setData) unconditionally — it doubles
// as the optimistic local write when the mutation was queued.
```

Rules for new write functions:

- **Creates use client-generated ids** (`doc(collection(db, X))` + `setDoc`), never `addDoc` —
  the optimistic local record must keep the same id after sync.
- **Ownership checks fall back to the local cache when offline** (the AsyncStorage copy only ever
  holds the signed-in user's data); don't let a pre-write `getDoc` kill the whole offline write.
- **Batch commits** pass one mutation per document to `writeOrQueue` (replay doesn't need atomicity;
  last-write-wins is the accepted conflict policy).
- Only offline/`unavailable` errors are queued; permission/validation errors still throw.
- Payloads containing `Timestamp` are serialized automatically; never put a `serverTimestamp()`
  sentinel in a queued payload — pass `Timestamp.now()` in the mutation and keep `serverTimestamp()`
  in the online `firestoreOp` closure (see `locations.ts` / `farmCapacity.ts`).

---

## Specific Service Behaviors

### `src/services/plants.ts`

- Uses paginated reads.
- Soft-deletes plants with `is_deleted` and `deleted_at`.
- Resolves image filenames to local URIs before returning plants.
- Deletion cascades into tasks along two different paths, and the difference matters:
  - **Soft delete** (`deletePlant`, `deletePlantsForBed`) calls `disableTasksForPlantIds()`. Templates
    and their logs are kept, just disabled, because the plant is restorable. `restorePlant` /
    `restorePlantsForBed` then re-sync via `syncCareTasksForPlant()`, which re-enables the templates
    and re-bases `next_due_at` so a long-deleted plant returns due today, not months overdue.
  - **Permanent delete** (`permanentlyDeletePlant`, `permanentlyDeletePlantsForBed`) calls
    `deleteTasksForPlantIds()`, which removes the templates **and** their completion history.
  - Never hard-delete tasks from a reversible action, and never on a negative read (an id merely
    absent from a list) — doing that once emptied `task_templates` silently.

### `src/services/tasks.ts`

- Avoids extra Firestore composite index requirements by filtering and sorting in memory in some queries.
- `markTaskDone()` writes a task log, updates `next_due_at`, and also updates plant last-care fields.
- Recurring task due times are normalized to 6:00 PM.
- `syncCareTasksForPlant()` auto-generates water, fertilise, prune, and coconut harvest (age-derived) tasks from plant settings. It is the single owner of scheduling — re-derive templates through it rather than computing due dates at a call site.
- `rebuildCareTasksForAllPlants()` fans out over `syncCareTasksForPlant()` for every plant, sequentially (parallel would race its per-plant template reads against each other's writes). Backs Settings → App Maintenance → **Rebuild Care Schedule**, and the bulk restore path. Additive: it creates and updates, never deletes. Deliberately not wired to startup.
- `disableTasksForPlantIds()` is the reversible counterpart to `deleteTasksForPlantIds()` — one template read plus chunked batched writes, used by soft delete and archiving. `disableTasksForPlant()` delegates to it.
- The full `TaskType` union is `water | fertilise | prune | repot | spray | mulch | harvest`. Repot, spray, and mulch are user-created; sync does not auto-generate them.

### `src/services/journal.ts`

- Supports multiple images through `photo_filenames` and `photo_urls`.
- Still carries the legacy single `photo_url` field for backward compatibility.
- `getJournalMetadata()` fetches entries without resolving images, used by `CalendarScreen` for lightweight reads.

### `src/services/backup.ts`

Two flows, both ZIP-based:

- **Images-only** — `exportImagesOnly()` / `importImagesOnly()`. Photos plus a small manifest; data is untouched.
- **Complete backup** — `exportFullBackup()` / `importFullBackup()`. All user data as `backup.json` plus every referenced photo. Restore rehydrates AsyncStorage first, then pushes collections to Firestore under their original doc ids. Destructive on the target device, so callers must confirm before invoking.

Notes:

- When importing images, matching is filename-based (`relinkImportedImages` is shared by both import flows so the matching logic never diverges).
- All four entry points accept an optional `BackupProgressCallback` (`src/utils/zipHelper.ts`) and emit `collecting → resolving → packing → compressing → saving` on export, `extracting → saving` on restore. `SettingsScreen` renders these as button labels; a backup over a large photo set otherwise looks hung.
- **Binary I/O must stay on the modern `expo-file-system` `File` API** (`bytes()` / `write()`). The legacy base64 reader is a fallback only, for URIs the modern API cannot open (Android `content://` MediaLibrary assets). Converting whole archives through base64 strings in JS previously made a large backup take minutes.
- Photo entries are added to the ZIP with `level: 0` (store). JPEG/PNG data does not deflate further, so compressing it is pure CPU cost on the blocking `zipSync` call.
- Image reads run through a bounded-concurrency pool (`IMAGE_READ_CONCURRENCY`), not `Promise.all` — unbounded parallelism would hold hundreds of whole photos in memory at once.

---

## Caching Architecture

- `src/lib/dataCache.ts` is an in-memory freshness cache (30-second TTL) between screens and service calls.
  - Use `getCached()`/`setCached()` for short-lived reads.
  - Use `invalidate()`/`invalidateAll()` after mutations.
  - Does not replace AsyncStorage (offline fallback).
- `src/lib/storage.ts` wraps AsyncStorage access via `getData()` and `setData()`.
- `clearAllData()` should clear only local cached data, not Firestore internals.

---

## Offline Write Queue

Firestore uses `memoryLocalCache()` (the JS SDK has no persistent cache in React Native), so the
app implements its own durable offline writes:

- **Types** — `OfflineMutation` in `src/types/offline.types.ts`: `{ collection, docId, op, payload, retryCount }`
  where `op` is `create` (→ `setDoc`), `update` (→ `updateDoc`), `set` (→ `setDoc(..., { merge: true })`),
  or `delete` (→ `deleteDoc`).
- **Store** — `src/lib/offlineQueue.ts` persists the queue at `KEYS.OFFLINE_QUEUE`
  (`@garden_offline_queue`), serialized behind a lock. Mutations are **coalesced per document**:
  create+update → merged create; update+update → merged update; create+delete → both dropped;
  update+delete → single delete. `subscribeQueueCount()` feeds the pending badge in `OfflineBanner`.
- **Pure logic** — coalescing and `Timestamp` encode/decode rules live Firestore-free in
  `src/utils/offlineQueueLogic.ts` so they're unit-testable.
- **Entry point** — `writeOrQueue()` in `src/lib/offlineWrite.ts` (see Write path above): tries the
  write, and enqueues only on offline/`unavailable` errors.
- **Replay** — `flushOfflineQueue()` in `src/services/offlineSync.ts` replays FIFO on reconnect:
  `not-found` updates/deletes are dropped; other failures pause the flush (preserving per-document
  ordering) and are retried on later flushes, dropped after 5 strikes. After a successful flush it
  calls `invalidateAll()` and stamps `KEYS.LAST_SYNC`. Concurrent calls share one flush.
- **Trigger** — `App.tsx` subscribes via `subscribeToNetworkChanges()` (`src/utils/networkState.ts`)
  and runs a debounced flush on offline→online transitions and once after sign-in.
- **Conflict policy** — last-write-wins. Reference data services (weather, plantCatalog,
  plantCareProfiles) and `backup.ts` / `BedTaskResolver.ts` stay online-only by design.
  `restorePlant()` is also online-only (archived plants aren't in the offline cache).
- **Tests** — `src/__tests__/utils/offlineQueueLogic.test.ts`, `lib/offlineQueue.test.ts`,
  `services/offlineSync.test.ts` (flush mechanics via an injected executor — the Firestore SDK is
  never mocked).

---

## Plant and Settings Data

- Core types live in `src/types/database.types.ts`. Update types first when changing schema.
- `Plant` includes: care frequencies, health status, growth stage, pest and disease history, soft-delete fields, coconut-specific metrics, `care_schedule` metadata.
- Plant catalog defaults and aliases live in `src/services/plantCatalog.ts`.
- Care profile overrides live in `src/services/plantCareProfiles.ts`.
- Location defaults and normalization live in `src/services/locations.ts`.
- These settings are cached locally and synced through `user_settings`.

---

## Reliability and Logging

- Sentry is initialized in `App.tsx` when a DSN is configured.
- Global error and unhandled promise rejection handlers are wired up in `App.tsx`.
- Use `logError()`, `logAuthError()`, `logStorageError()`, and `setErrorLogUserId()` from `src/utils/errorLogging.ts`.
- `safeStorage` in `src/utils/safeStorage.ts` is the defensive wrapper for AsyncStorage access.
- `src/utils/logger.ts` provides production-safe console logging.

---

## Additional Utilities

- `src/utils/appLifecycle.ts` — app lifecycle management, used in `App.tsx`.
- `src/utils/dateHelpers.ts` — date parsing, formatting, Firestore timestamp conversion.
- `src/utils/errorTracker.ts` — error tracking service.
- `src/utils/networkState.ts` — network connectivity state; used by `firestoreTimeout.ts`, and its `subscribeToNetworkChanges()` drives the offline-queue flush and `useOfflineStatus`.
- `src/utils/textSanitizer.ts` — text sanitization for user input.
- `src/utils/zipHelper.ts` — ZIP utilities used by backup.
- `src/utils/firestoreTimeout.ts` — `withTimeoutAndRetry()` wrapper for Firestore operations.

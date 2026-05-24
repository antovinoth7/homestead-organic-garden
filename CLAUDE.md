# Organic Gardening Planner — Claude Code Standards

React Native + Expo (SDK 54) app for organic garden management. Android/iOS. Firebase Auth + Firestore, local-first offline architecture. Tamil Nadu / Kanyakumari default locale. Entry: `App.tsx`. Types: `src/types/database.types.ts`.

## Critical Rules

1. **No Firebase Storage** — images are device-local only (MediaLibrary). See `docs/IMAGE_STORAGE.md`.
2. **No `any`** — extend or wrap missing third-party types.
3. **No inline styles** — all styles in `src/styles/*Styles.ts` via `createStyles(theme)`.
4. **No hardcoded colors** — use `useTheme()` tokens only.
5. **No `console.log`** — use `src/utils/logger.ts`.
6. **Never call `terminate()`** on the Firestore instance.
7. **Never mock Firestore** in tests — use emulator.
8. **Imports use `@/` path alias** — not `../../` relative paths.

## Architecture

- **Offline-first**: in-memory cache → AsyncStorage → Firestore.
- **Separation**: screens orchestrate UI; services own data; hooks own derived state.
- **Free-tier**: avoid Firestore reads servable from cache. Batch writes.
- **Service pattern**: cache check → `refreshAuthToken()` → `withTimeoutAndRetry()` → update cache → AsyncStorage fallback.
- **Cache**: `src/lib/dataCache.ts` (30s TTL). `invalidate()`/`invalidateAll()` after mutations.
- **Tamil language strategy**: English ↔ Tamil toggle in Settings (Phase G). No language mixing. `tamilName` fields are data-only until Phase G ships the toggle.

## Directory Structure

src/
components/ — Reusable UI (.tsx, PascalCase)
config/zones/ — Agro-climatic zone definitions
hooks/ — Custom hooks (use*.ts)
lib/ — Firebase init, storage, imageStorage, dataCache
migrations/ — Schema migration runner + numbered files
navigation/ — AppNavigator.tsx
screens/ — *Screen.tsx
services/ — Data layer (camelCase .ts, one per domain)
styles/ — \*Styles.ts (createStyles factory)
theme/ — Color tokens (light/dark)
types/ — database.types.ts, navigation.types.ts
utils/ — Pure utilities

````

## Key Patterns

- **Naming**: Components=PascalCase, Screens=`*Screen`, Hooks=`use*`, Services=camelCase, Styles=`*Styles.ts`, Constants=`UPPER_SNAKE_CASE`
- **Components**: functional only (except ErrorBoundary). `Props` interface at top. `useMemo(() => createStyles(theme), [theme])`. `useCallback` for prop functions.
- **Hooks**: one concern each. Cleanup subscriptions. `useFocusEffect` for screen data refresh. Explicit return types.
- **State**: `useState` local, Context cross-screen, no Redux. After mutations call `invalidate()`.
- **Performance**: `FlatList` for 20+ items. No anon functions in JSX. `expo-image` with `cachePolicy="memory-disk"`.
- **Navigation**: defined in `AppNavigator.tsx`. Types in `navigation.types.ts`. Typed hooks only. Primitive route params.
- **Commits**: `type(scope): description` — Conventional Commits. `commitlint` enforced.

## Quick Start

```bash
npm start          # Expo dev server
npm run android    # Android
npm run ios        # iOS
npm run lint       # ESLint (zero errors required)
npm test           # Jest
````

## New Feature Order

1. Define types in `src/types/database.types.ts`
2. Create service (cache → auth → Firestore → AsyncStorage pattern)
3. Create hook wrapping service with `loading`/`error` states
4. Create screen calling hook — screens never call services directly
5. Create components + `*Styles.ts` in `src/styles/`
6. Write tests in `src/__tests__/`
7. `npm run lint` + `npm test` — both must pass

## Schema Changes

- Required field or data reshape → write migration in `src/migrations/`, bump `LATEST_SCHEMA_VERSION`
- Optional field → no migration, handle `undefined` via `?? fallback`
- Full details: `docs/SCHEMA_MIGRATIONS.md`

## Reference Docs

Read these on demand when working in specific areas:

- **`docs/CONVENTIONS.md`** — TypeScript, naming, component/hook/styling standards, code quality, AI checklist, commit format
- **`docs/SERVICES.md`** — service layer, Firestore shape, specific service behaviors, caching, utilities
- **`docs/COMPONENTS.md`** — component/styles inventory, reusable UI, custom hooks, UI conventions
- **`docs/SCHEMA_MIGRATIONS.md`** — migration runner, schema change workflow
- **`docs/DOMAIN_LOGIC.md`** — agro-climatic zones, seasons, plant/care helpers
- **`docs/TESTING.md`** — test standards, fixture factories, coverage targets
- **`docs/IMAGE_STORAGE.md`** — image storage rules, platform behavior, migration flow

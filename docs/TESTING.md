# Testing Standards

## Structure

- Test files live in `src/__tests__/` with `*.test.ts` or `*.test.tsx` extensions.
- Every new service function must have a corresponding unit test.
- Every new utility function must have a unit test.
- Component tests render with `react-test-renderer` (see "How component tests render" below).
- Do NOT mock Firestore — use the Firebase emulator for integration tests.
- Test fixtures live in `src/__tests__/fixtures/` as exported factory functions.
- Coverage targets: 30% on first merge, growing to 70% over sprints.
- Run `npm test` before pushing.

> Line numbers above this point are referenced from `docs/ENTERPRISE_AUDIT.md` —
> append below rather than inserting into the list.

---

## Current Shape

- **155 suites / 2027 tests / 5 snapshots**, all passing. Jest with the `ts-jest`
  preset and `testEnvironment: 'node'` — **not** `jest-expo`.
- Coverage is measured over `src/utils/**` and `src/config/**` only
  (`collectCoverageFrom` in `jest.config.js`, with `*Styles.ts` excluded). The 30%
  threshold is therefore **not** app-wide: `src/services`, `src/lib`,
  `src/components`, `src/hooks`, and `src/screens` are outside instrumentation.
- `src/lib/imageStorage.ts` and `src/services/backup.ts` have **no tests at all**
  and carry the most native surface in the app (MediaLibrary, file system,
  document picker, sharing). Photo save/delete and backup export/import are
  verified manually. Treat changes there with corresponding care.
- No test touches a Firestore emulator today; services are tested through their
  pure selectors, with the app's own boundary modules (`@/utils/safeStorage`,
  `@/utils/networkState`, `@/utils/firestoreTimeout`) mocked so the import graph
  loads under Node.

## How component tests render

There is no global setup file and no `jest-expo` preset. The 15 component and
hook tests each:

1. Replace `react-native` wholesale via `jest.mock`, supplying string host
   elements (`'View'`, `'Text'`, …) instead of real native components.
2. Render with `jest.requireActual('react-test-renderer')` and set
   `globalThis.IS_REACT_ACT_ENVIRONMENT = true` in `beforeAll`.
3. Assert by walking the tree with `root.findAll` / `findByProps`.

`react-test-renderer` is an **explicit devDependency pinned to match `react`
exactly** (currently 19.2.3). It was previously resolved transitively via
`jest-expo`; bump it in lockstep whenever React moves, or `npm ci` will fail on
the peer range.

`@testing-library/react-native` and `@testing-library/jest-native` are declared
but **currently unused by any test**. Adopting them (which would let these tests
load real React Native and become a genuine compatibility signal) or removing
them is tracked in `docs/IMPLEMENTATION_ROADMAP.md` → Post-Upgrade Backlog.

---

## Fixture Factory Pattern

```typescript
// src/__tests__/fixtures/plant.fixtures.ts
import { Plant } from '../../types/database.types';

export function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: 'test-plant-id',
    name: 'Test Tomato',
    type: 'Vegetable',
    user_id: 'test-user-id',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}
```

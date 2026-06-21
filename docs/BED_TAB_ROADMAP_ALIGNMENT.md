# Bed Tab ↔ Roadmap Alignment Review

> Date: 2026-06-20
> Reviewed: `docs/IMPLEMENTATION_ROADMAP.md` (Phase B2) against the shipped "Beds" tab
> Scope: documentation reconciliation + one small code cleanup (bed-tab tasks view removed)

## Verdict

**Strong alignment at the phase/feature level; drift in the detail.**

The bed tab is unambiguously **Phase B2 — Bed Management**, and the roadmap
captures its architecture correctly: first-class bed entities, the crop-rotation
engine, companion/guild validation, two-tier task generation, and cross-cutting
integration into Plants / Calendar / Home / Journal. Phase B2 is correctly marked
✅ Complete, and the gap rows it closed (G31 bed management, G37–G43 rotation
sub-systems, G45 add-to-catalog) match shipped reality.

The misalignments were **all staleness**, not design disagreement: the roadmap's
last reconciliation pass (June 15, 2026) explicitly changed no code and only
re-statused Phases B3/B4, so ~35 commits of June bed work and several
April-design details were never folded back into the B2 section.

**Alignment score: ~8/10** — accurate skeleton, stale specifics. After this pass
the B2 section reflects the shipped code.

## What the roadmap got right

- Phase B2 scope, goal ("generic farm layout, not locked to coconut intercrop"),
  and ✅ Complete status.
- The rotation engine surface: `getCrossBedStatus`, `getHarvestGapWarnings`,
  6-rule coordinator checklist, green-manure-by-season, legume coverage.
- Two-tier task generation via `BedTaskResolver` / `syncBedTasksFromPlants`.
- Cross-cutting integration points (PlantCard bed chip, BedContextSection,
  group-by-bed, Calendar bedMap, Today bed overview, Journal bed picker).
- The B2.16 Rotation-tab story and its "tasks stay in the Care Plan" intent.

## Drift found (and how it was reconciled)

| # | Roadmap said | Shipped code | Action taken |
|---|---|---|---|
| 1 | `BedType` = 8 types incl. `coconut_intercrop` | 7 types (`leafy, fruiting, spice, root_legume, climber_trellis, three_sisters, medicinal_guild`) | Corrected B2.1, delivered block, F12 |
| 2 | F12: `BedType = climber\|herb\|mixed` | Never existed | Corrected F12 type list |
| 3 | F12: `BedLayer = canopy\|mid\|ground_cover\|root` | `canopy\|understory\|ground_cover\|root\|climber` | Corrected F12 + delivered block |
| 4 | Wizard = 7 steps incl. `PlantsMatchStep`/`BedSuccessStep` | 6 steps; `BedLayoutStep` (row layout) shipped instead | Corrected B2.5, hooks/screens delivered lines |
| 5 | B2.11 SVG diagram ⏭ Deferred | Shipped as `BedTopDownMap`/`BedLayerStack`/`BedSuccessionTimeline`/`BedRowLayout`/`BedZoneIllustration` | B2.11 → ✅ Superseded |
| 6 | B2.12 tests ⚪ open | `bedStatus`, `bedOccupancy`, `bedEditReconcile`, `rowLayoutEngine.bedTypes`, `bedRotationSummary` tests exist | B2.12 → 🔄 partial; remaining gap noted |
| 7 | B2.13 ships `BedTasksScreen`; B2.16 says "no Tasks tab" | Contradiction | **Code**: removed `BedTasksScreen` from bed tab (tasks → Care Plan); doc updated |
| 8 | Row-level rotation not documented | `BedRowSnapshot`/`BedRowHistoryEntry`, `rowLayoutEngine.ts`, `bedEditReconcile.ts` | Captured in new B2.17 block |
| 9 | June components/utils/config undocumented | `BedFilterSheet`, `BedCapacityModal`, `BedDeleteModal`, `ClearBedCta`; `bedStatus`/`bedOccupancy`/`bedNameGenerator`/`filterAndSortBeds`; `soilPrepEngine`/`legumeRelevance`/`plantingSequence`/`layerMeta` | Captured in B2.17 block |

## Code change in this pass

The B2.13 ↔ B2.16 contradiction was resolved in favour of B2.16's stated intent:
the dedicated **`BedTasksScreen` was removed from the bed tab**. Bed-level task
*generation* (`BedTaskResolver` / `syncBedTasksFromPlants`) is retained — those
tasks now surface in the **Care Plan only**.

Removed: the "View Tasks" CTA in `BedDetailScreen`, the `BedTasks` route/import in
`AppNavigator.tsx`, the `BedTasks` param + prop types in `navigation.types.ts`,
and `src/screens/BedTasksScreen.tsx`. `npx tsc --noEmit` passes.

## Recommendation

Adopt a lightweight habit: **reconcile the B2 section on each bed-feature merge**
(or batch monthly), since the bed tab is the app's fastest-moving area. The
roadmap's reconciliation discipline is good — it just needs to cover B2, not only
the newer phases.

## Suggested next roadmap work (planning-only — not started)

- **B2.12** — close the remaining test gap: `beds.ts` service CRUD (emulator) +
  `backup.ts` beds-collection coverage.
- **B4.5** — `SeasonalAdaptationScreen` (Phase B4 still In Progress).
- **Phase C** — Home dashboard overhaul, which is heavily bed-aware
  (`BedsQuickScroll`, needs-attention bed labels, bed tag chips on tasks).

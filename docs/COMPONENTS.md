# Components & Styles Inventory

> For the exact per-file inventory with line counts, see the generated [`docs/CODEMAP.md`](CODEMAP.md)
> (`npm run codemap`). This file explains the conventions and groups components by domain —
> it deliberately avoids hardcoded counts that go stale.

## Styles Architecture

- All styles live in `src/styles/` as separate files. No screen or component has inline `StyleSheet.create`.
- Style files export a `createStyles(theme)` factory function that takes the theme object and returns a `StyleSheet`.
- Exception: `errorBoundaryStyles.ts` exports a static `styles` object (class component, no theme).
- Exception: `floatingTabBarStyles.ts` exports both `createStyles` (tab bar) and `fabStyles` (FAB button).
- Exception: `calendarStyles.ts` also exports the `getStartOfWeek()` helper alongside styles.
- Naming convention: `src/styles/<camelCaseName>Styles.ts` matching the screen or component name.
- When adding a new screen or component, create its style file in `src/styles/` following this pattern.
- In screens/components, import and call `createStyles(theme)` — use `useMemo(() => createStyles(theme), [theme])` for larger screens.
- Note: several style files exceed 1,500 lines (`bedCreationWizardStyles`, `plantFormStyles`, `calendarStyles`) — Grep for the style key you need rather than reading them whole.

## Reusable Primitives (prefer these over rebuilding)

- `CollapsibleSection` — expandable section wrapper
- `ScreenHeader` — standard screen header
- `FloatingLabelInput` — animated label text input
- `ThemedDropdown` — themed dropdown picker
- `FloatingTabBar` (includes `AnimatedFAB` and `FloatingTabBarProvider`) — tab bar with scroll-hide
- `SegmentedTabs` — generic horizontally-scrollable pill tab bar; use for overflowing tab sets. For a small fixed set inside a card (e.g. the Appearance picker in `SettingsScreen`), match the pill visuals with local styles instead — the component's scroller and bottom hairline are meant for full-width tab bars.
- `FieldHelp` / `FieldLabelWithHelp` — inline help affordances
- `UndoToast` — post-action undo snackbar
- `OfflineBanner` (+ `useOfflineStatus`) — connectivity strip above the navigator; shows offline state and pending-sync count from the offline write queue
- `SectionHeader` — dashboard section heading (17px title + optional right-aligned action link) sitting on the page background above its content; use it for any new home-screen section rather than a bare `<Text>`
- `ErrorBoundary` — class component error boundary
- `VoiceDictation` / `VoiceInputButton` (+ `useVoiceInput`, `useVoiceLocale`) — speech-to-text for existing notes/analysis fields. Default layout is a Tamil/English segmented control with an adjacent mic on its own row above the input; `compact` renders a 28px split `mic | language` pill that sits at the trailing end of a field’s existing label row, costing no extra height (used by `CatalogTextBlock`). Both keep 44px touch targets — compact via outer-side `hitSlop`. The dictation language is app-wide and persisted (`useVoiceLocale`), so every mounted control agrees and the choice survives a restart
- `ImageZoomModal` (+ `usePinchZoom`) — pinch-zoom photo viewer
- Modals in `src/components/modals/`: `ConfirmDeleteModal` (shared delete confirmation — use this, not bespoke modals), `DiscardChangesModal`, `PhotoSourceModal`, `TaskCompletionModal`, `CreateTaskModal`, `PestDiseaseModal`, `LocationEditModal`, `LocationReassignModal`, `BedCapacityModal`

## Components by Domain

- **Plant detail sections** (`PlantDetailScreen`): `PlantKeyInfoSection`, `CareScheduleSection`, `GrowthStageSection` (+ `GrowthStageTimeline`, `PinGrowthStageModal`), `HarvestInfoSection`, `HarvestHistorySection` (+ `HarvestYieldChart`), `CompanionPlantingSection`, `CoconutSection`, `PestDiseaseHistorySection`, `PlantNotesSection`, `PlantTasksSection`, `DetailSection`, `PlantInfoRow`
- **Catalog detail sections** (`CatalogPlantDetailScreen`): `DetailQuickInfoSection`, `DetailNutritionSection`, `DetailCareGuidanceSection`, `PlantCatalogList`
- **Catalog browse** (`ManagePlantCatalogScreen`): `CatalogSearchBar`, `CatalogBrowseRow`, `CatalogSectionHeader`, `CatalogSkeletonRows`, `CatalogSearchResultRow`, `RecentSearchChips`, `HiddenPlantsSection`, `CatalogFilterSheet`. The header carries search and a funnel only — `CatalogFilterSheet` owns both facets, the category (an `All` chip plus one per `CATALOG_GROUP_ORDER` entry, `All` being the default) and the grouping mode. The category pill rail that used to sit above the list is gone; the funnel badge counts how many facets are off their default.
- **Reference browse** (`PestListScreen`, `DiseaseListScreen`, `OrganicInputListScreen`): `ReferenceListView` (pests + diseases) and `OrganicInputListView` share `ReferenceBrowseHeader`, `ReferenceFilterSheet` and `ReferenceSectionHeader`, all styled from `referenceBrowseStyles`. The header matches the catalog's — a magnifier that expands in place and a funnel with a badge counting the facets off default; the always-visible search field and the category pill rail are gone, along with `ReferenceFilterChips`. `ReferenceFilterSheet` is the catalog sheet generalised to a declarative `FacetSection[]`, so each domain supplies its own facets: pests and diseases offer Category, Risk now, Treatment effort and Group By (Category / Risk / A–Z), organic inputs offer Category, DIY recipe and Group By (Category / A–Z). Facet logic is pure and lives in `utils/referenceFilters.ts` and `utils/organicInputFilters.ts` (both follow `plantFilters.ts`, counting each facet against every *other* one); state lives in `useReferenceBrowse` / `useOrganicInputBrowse`. Risk reuses `getCurrentRisk` so the chip and `ReferenceListCard`'s "HIGH NOW" badge can never disagree; effort reduces an entry's treatments to the gentlest via `easiestEffort`, so each entry lands in exactly one bucket. There is no count line above the list: the total is stated by the header subtitle, each group by its section header, and each facet by its chip in the sheet. That row also carried the only `FieldHelp` on `CATEGORY_DESCRIPTIONS`, so those descriptions are no longer surfaced anywhere in the UI (the tables stay in `config/*`); if they are wanted back, the natural home is each category chip's `accessibilityHint`. The hooks take the grouped registry bundle the three screens already build, which is what carries the canonical category order.
- **Plant forms** (`src/components/forms/`): `PlantAddWizard` + `WizardStep1/2/3`; `PlantEditForm` + `Edit*Section` (BasicInfo, Location, CareSchedule, Coconut, QuickInfo, Nutrition, Relationships, CareGuidance, Safety, Beneficials)
- **Beds**: `BedCard`, `BedTopDownMap`, `BedLayerStack`, `BedRowLayout`, `BedSuccessionTimeline`, `BedZoneIllustration`, `BedRotationView`, `RotationStatusCard`, `BedContextSection`, `BedFilterSheet`, `BedPlantPickerSheet`, `DraggablePlantRow`, `ClearBedCta`, `PlantEntryResolverSheet`
- **Today dashboard**: `DashboardHero` (greeting + progress ring + per-type activity rows + health tiles), `NeedsAttentionScroll` (the "Falling behind" rail), `WeatherDeck` + `WeatherPlotCard` (+ legacy `WeatherCard`), `TipStrip`, `BedsQuickScroll` (bed cards use bundled plant thumbnails for preview pins and a themed leaf fallback for custom plants; the stage-aware status chip comes from `utils/bedPreview.ts`), `PrepCard`
- **Today screen** (`src/components/today/`): `TodayHeader`, `PlotCarousel` → `PlotCard`, `NeedsActionRow`, `SeasonBlock`, `ForecastOverlay`. `SeasonBlock` closes the screen: season progress, a tappable crop tile per suggestion (a two-column grid of chromeless tiles — a rounded 4:3 `ReferenceThumb variant="tile"` photo with the crop name beneath it, no border or panel, plus days-to-harvest and spacing when the plant profile states them, opening `More → CatalogPlantDetail`), and the seasonal risk on its own warning ground. Free bed space is deliberately not repeated here — the plot cards own that count. Closing windows (`PlantNowRecommendation.closing`) are deliberately not marked visually — the flag survives only in the tile's screen-reader label. Its suggestions come from `config/kanyakumariPlantingCalendar` via `getKanyakumariPlantingWindows`, enriched in `utils/sowNowChips`; off Kanyakumari it states why it is empty and links to My Farm. `PlotCarousel` is the plot block: one plot renders as a plain full-width card, two or more as a snap-paging horizontal rail with the next card peeking and a row of page dots. `PlotCard`'s forecast pill is tinted by `utils/weatherTone` and its context sentence is tagged with the rung `utils/plotBriefLine` picked (`Late` / `Rain` / `Load`); that pill opens `ForecastOverlay`, a full-bleed page (not a route) built in the same card language — today on a `hero*` gradient card with chance / rainfall / jobs on a raised panel, then one card per following day carrying its condition as a 3px left rail coloured from the same `utils/weatherTone`, never as a tinted card ground. On both inventory tiles the status rows are the tap targets and the totals above them are captions: a health row opens `Plants → PlantsList` filtered to that status and plot, a bed lifecycle row opens `Beds → BedList` filtered to that `BedLifecycle` and plot (route params `lifecycleFilter` / `plotFilter`, applied into each list's own filter sheet so they are visible and clearable). The only unfiltered link is "Add a bed" on the tile that stands in for a plot with no beds.
- **Calendar** (`src/components/calendar/`): `MonthCalendarView`, `WeekCalendarView`, `SwipeableTaskCard` (rendered through `CalendarScreen`'s virtualized `SectionList` — add new task rows as section data, not `.map()` in a ScrollView)
- **Lists/cards**: `PlantCard`, `TaskCard`, `JournalEntryCard`, `PlantFilterSheet`
- **Locations**: `LocationProfileEditor`

## Custom Hooks (`src/hooks/`)

- Plant form: `usePlantFormState` (large — 120+ returned properties), `usePlantFormData`, `usePlantDetail`, `usePlantCatalogManager`
- Beds: `useBedCreationWizard` (+ `bedWizardValidation` helpers), `useBedData`, `useBedDetail`, `useBedOptions`, `useCrossBedStatus`
- Dashboard/calendar: `useCalendarData`, `useWeather`, `useWeatherLocations`, `useFarmCapacity` (the Today screen loads its own tasks/plants so the hero and the alert rail share one array)
- Reference browse: `useReferenceBrowse` (pests + diseases), `useOrganicInputBrowse` — header modes, filter facets and the sectioned list, over the pure utils in `utils/referenceFilters.ts` and `utils/organicInputFilters.ts`
- Misc: `useLocationManager`, `useOnboardingStatus`, `useVoiceInput`, `usePinchZoom`, `useOfflineStatus` (connectivity + pending offline-write count)

When adding complex data logic to a screen, extract it into a custom hook in `src/hooks/`.

## UI Conventions

- Use `useTheme()` for colors and shared tokens.
- Use `useThemeMode()` for theme mode changes. The only place the user picks a mode is the **Appearance** section at the top of `SettingsScreen` (More → Settings) — a Light / Dark / Auto segmented pill row. Do not add theme controls to other screens.
- Prefer existing themed styles over new hardcoded colors.
- Most screens use safe area insets and refresh on focus; preserve those patterns.
- Main tabs: `Home`, `Plants`, `Care Plan`, `Journal`, `More`.
- Nested stacks exist for Plants, Journal, and More. Keep existing route names unchanged unless you update all callers.
- Providers wrap the app: `ErrorBoundary` → `SafeAreaProvider` → `ThemeProvider`.

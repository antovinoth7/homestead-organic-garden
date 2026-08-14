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
- `VoiceDictation` / `VoiceInputButton` (+ `useVoiceInput`) — speech-to-text for any text field
- `ImageZoomModal` (+ `usePinchZoom`) — pinch-zoom photo viewer
- Modals in `src/components/modals/`: `ConfirmDeleteModal` (shared delete confirmation — use this, not bespoke modals), `DiscardChangesModal`, `PhotoSourceModal`, `TaskCompletionModal`, `CreateTaskModal`, `PestDiseaseModal`, `LocationEditModal`, `LocationReassignModal`, `BedCapacityModal`

## Components by Domain

- **Plant detail sections** (`PlantDetailScreen`): `PlantKeyInfoSection`, `CareScheduleSection`, `GrowthStageSection` (+ `GrowthStageTimeline`, `PinGrowthStageModal`), `HarvestInfoSection`, `HarvestHistorySection` (+ `HarvestYieldChart`, `HarvestWeightInput`), `CompanionPlantingSection`, `CoconutSection`, `PestDiseaseHistorySection`, `PlantNotesSection`, `PlantTasksSection`, `DetailSection`, `PlantInfoRow`
- **Catalog detail sections** (`CatalogPlantDetailScreen`): `DetailQuickInfoSection`, `DetailNutritionSection`, `DetailCareGuidanceSection`, `PlantCatalogList`, `PlantCategoryTabs`
- **Plant forms** (`src/components/forms/`): `PlantAddWizard` + `WizardStep1/2/3`; `PlantEditForm` + `Edit*Section` (BasicInfo, Location, CareSchedule, Coconut, QuickInfo, Nutrition, Relationships, CareGuidance, Safety, Beneficials)
- **Beds**: `BedCard`, `BedTopDownMap`, `BedLayerStack`, `BedRowLayout`, `BedSuccessionTimeline`, `BedZoneIllustration`, `BedRotationView`, `RotationStatusCard`, `BedContextSection`, `BedFilterSheet`, `BedPlantPickerSheet`, `DraggablePlantRow`, `ClearBedCta`, `PlantEntryResolverSheet`
- **Today dashboard**: `DashboardHero` (greeting + progress ring + per-type activity rows + health tiles), `NeedsAttentionScroll` (the "Falling behind" rail), `WeatherDeck` + `WeatherPlotCard` (+ legacy `WeatherCard`), `SeasonPanel` (one always-open seasonal card: month almanac highlight + season care rhythm + nested green-manure prompt + a "Sow now" list of crop rows showing days-to-harvest from the care profiles — replaces the former `AlmanacHighlight`, `PlantNowSection` and `SeasonalAlmanacScreen`; the Jeevamrutha shortcut `InputReminderStrip` was removed, the recipe lives in More → Input Recipes), `TipStrip`, `BedsQuickScroll` (bed cards with a grid-paper tile of the bed's own plant emoji — pins and the stage-aware status chip come from `utils/bedPreview.ts`), `PrepCard`
- **Today screen** (`src/components/today/`): `TodayHeader`, `PlotCarousel` → `PlotCard`, `NeedsActionRow`, `SeasonBlock`, `ForecastOverlay`. `PlotCarousel` is the plot block: one plot renders as a plain full-width card, two or more as a snap-paging horizontal rail with the next card peeking and a row of page dots. `PlotCard`'s forecast pill is tinted by `utils/weatherTone` and its context sentence is tagged with the rung `utils/plotBriefLine` picked (`Late` / `Rain` / `Load`).
- **Calendar** (`src/components/calendar/`): `MonthCalendarView`, `WeekCalendarView`, `SwipeableTaskCard` (rendered through `CalendarScreen`'s virtualized `SectionList` — add new task rows as section data, not `.map()` in a ScrollView)
- **Lists/cards**: `PlantCard`, `TaskCard`, `JournalEntryCard`, `PlantFilterSheet`
- **Locations**: `LocationProfileEditor`

## Custom Hooks (`src/hooks/`)

- Plant form: `usePlantFormState` (large — 120+ returned properties), `usePlantFormData`, `usePlantDetail`, `usePlantCatalogManager`
- Beds: `useBedCreationWizard` (+ `bedWizardValidation` helpers), `useBedData`, `useBedDetail`, `useBedOptions`, `useCrossBedStatus`
- Dashboard/calendar: `useCalendarData`, `useWeather`, `useWeatherLocations`, `useFarmCapacity` (the Today screen loads its own tasks/plants so the hero and the alert rail share one array)
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

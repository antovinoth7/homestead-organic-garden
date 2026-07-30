# Today Screen: Farmer-First Information Architecture Recommendation

> Application: Homestead Organic Garden  
> Screen reviewed: `src/screens/TodayScreen.tsx`  
> Review date: 31 July 2026  
> Scope: Single farm, multiple plots, and future true multi-farm operation

## Executive recommendation

The Today screen should stop behaving like a miniature report of the whole
application. It should become a scoped daily operations brief answering:

1. Which farm or plot needs attention?
2. What must be done now, and where?
3. What does today's weather change?
4. What can safely wait?

The minimum non-duplicative Home content is:

- Date and selected farm or plot.
- Remaining, overdue, and completed jobs.
- A small number of named, location-specific actions.
- Actual crop and bed exceptions.
- Operational weather for the next 24–48 hours.
- A small upcoming-work preview and quick field-logging actions.

Everything else should remain in Care Plan, Plants, Beds, Journal, My Farm, or
a new Seasonal Planning destination.

The product boundary should be:

> Home decides where to go and what to do. Care Plan manages the schedule.
> Beds and Plants manage inventory. Journal records reality. Seasonal Planning
> teaches and prepares.

## Important finding: the app is multi-plot, not multi-farm

The current application contains one user-level `FarmConfig` with one district
and agro-climatic zone. What the UI calls "farm plots" are string-named
`parentLocations`; task records have no farm or plot identifier.

Evidence:

- [`FarmConfig`](../src/types/database.types.ts#L7) is a single configuration
  object with one district and zone.
- [`LocationConfig`](../src/types/database.types.ts#L349) stores parent
  locations as strings and profiles keyed by those names.
- [`MyFarmScreen`](../src/screens/MyFarmScreen.tsx#L17) describes parent
  locations as farm plots and child locations as shared sections.
- [`TaskTemplate`](../src/types/database.types.ts#L639) has a plant ID and
  optional bed ID, but no farm or plot ID.

Consequently:

- Tasks, health, alerts, and beds are aggregated across the entire account.
- Only weather is aware of multiple plots.
- Swiping to a plot's weather does not scope the rest of Home.
- Separate farms with different districts, seasons, or settings cannot be
  represented reliably.
- Duplicate plant and bed names become ambiguous.

For the immediate release, these locations should consistently be called
**Plots**. If genuine multiple farms are required, the application needs a real
`Farm → Plot → Section → Bed/Plant` hierarchy rather than relabelling plots as
farms.

## Current Today screen

The visible information order in
[`TodayScreen.tsx`](../src/screens/TodayScreen.tsx#L360) is:

1. Date, greeting, task progress ring, per-type task bars, and plant-health
   totals.
2. A horizontal Needs Attention rail.
3. One seven-day forecast per plot.
4. A horizontal carousel containing every bed and a New Bed action.
5. A pre-monsoon preparation checklist when within 21 days of 1 June.
6. A dismissible daily tip.
7. An always-open seasonal panel containing an almanac note, care rhythm, green
   manure advice, and sowing suggestions.
8. A second "All caught up" state when no task templates are due.

### Current versus proposed

| Current Home content | Current problem | Proposed treatment |
| --- | --- | --- |
| Greeting and date | Friendly, but it does not identify the operational scope | Keep the date. Replace the prominent greeting with an `All plots / Plot name` selector. Hide the selector when only one plot exists. |
| Task ring | Completion is useful, but work remaining is more operationally important | Keep one compact summary: `5 remaining · 2 overdue · 3 done`. |
| Per-task-type bars | Repeat the ring and Care Plan; every row currently opens the same unfiltered screen | Remove. If batching is useful, show only active chips such as `Water 4 · Harvest 2` inside the work section. |
| Healthy, stressed, and sick totals | Healthy is not actionable, and unassessed plants are currently treated as healthy | Remove Healthy. Surface named sick, stressed, and unresolved pest or disease issues. |
| Needs Attention carousel | Useful concept, but it repeats overdue tasks, hides items horizontally, and caps the displayed count | Replace it with a short vertical priority queue showing the true total and a `View all` action. |
| Seven-day weather deck | Important but large, and its selected plot does not scope other Home data | Keep a 24–48-hour operational summary for the selected plot. Put the full forecast in a sheet or dedicated screen. |
| Every bed in a carousel | Duplicates the Beds tab, is newest-first rather than urgency-first, and does not scale | Remove. Show only actionable bed exceptions. |
| Pre-monsoon checklist | Looks like work but cannot be completed, scheduled, or tracked | Convert applicable rows into real Care Plan tasks. Home shows only due work or one event summary. |
| Daily tip | Generic, arbitrary, and frequently repeats seasonal guidance | Remove. Promote only a specific, plot-linked risk with a clear action. |
| Almanac, care rhythm, green manure, and sow-now list | Planning and reference content occupies the daily execution path | Move to Seasonal Planning. Promote one opportunity only when it is plot-specific and time-sensitive. |
| Bottom "All caught up" card | Repeats the hero and can appear while non-task risks remain | Use one holistic empty state in the work queue. |

## Key current problems

### 1. Home does not name work due today

The alert rail intentionally excludes tasks merely due today and starts after
one full day overdue. The farmer can see aggregate counts such as "3 watering
jobs," but must open Care Plan to discover which plot, bed, or crop needs work.

See [`ATTENTION_MIN_DAYS_OVERDUE`](../src/services/alertsLogic.ts#L34).

Home needs a limited preview of actual work. This is useful summarisation, not
unnecessary duplication.

### 2. The same overdue work appears several times

The current hero represents overdue work through:

- A red ring arc.
- An overdue pill.
- A per-task-type overdue icon and number.
- A red segment in each task-type bar.
- An individual Needs Attention card.

This gives the same fact several visual encodings without adding farm or plot
context. Additionally,
[`buildActivityRows`](../src/utils/activityRows.ts#L41) creates a row for every
known task type. An empty schedule can therefore show three `0/0` rows and a
`+8 more` control.

### 3. The Needs Attention rail is incomplete

Only watering, fertilising, pruning, harvest, and sick-plant conditions can
appear. Spray, transplanting, weeding, mulching, cultivating, and repotting
tasks can remain hidden behind aggregate counts.

The five-card cap is also misleading:

- The component slices the collection first.
- The title reports only the visible count.
- There is no explicit route to the hidden total.

See [`NeedsAttentionScroll`](../src/components/NeedsAttentionScroll.tsx#L55).

The proposed queue should accept every task type, display the true total, and
rank work by operational consequence.

### 4. Some important exceptions disappear

Rotation and harvest-gap alerts are computed as `rotation_due`, but that type is
excluded from the actionable rail. The Home mini bed status does not display
rotation risk either. These risks can therefore be calculated without ever
appearing on Home.

At the same time, unresolved pest and disease observations already recorded in
Journal are not included in Home's alert aggregation. Home should prefer
observed problems over generic seasonal pest tips.

### 5. "Healthy" overstates certainty

[`getPlantHealthSummary`](../src/utils/plantHealth.ts#L25) counts plants with no
health status and recovering plants as healthy. It also counts one row record
as one plant even when that row represents several physical plants.

From a farmer's perspective, "not assessed" is not equivalent to healthy.
Until a health-assessment timestamp exists, Home should show only explicit open
issues.

### 6. Weather and work do not share a scope

Tasks, plants, health, and beds are account-wide aggregates. Weather alone is a
swipeable per-plot deck. The farmer can therefore view Plot B's forecast next
to task and health totals that include Plots A, B, and C.

Every Home number and item must follow one explicit scope:

- All plots.
- One selected plot.
- Eventually, one selected farm and its plots.

The selected scope should persist across visits and be passed to Care Plan,
Plants, and Beds when the farmer drills down.

### 7. Weather advice is too absolute

[`hasRainSoon`](../src/services/weatherLogic.ts#L35) treats at least 2 mm of rain
on either of the next two days as rain soon. The UI then says "skip watering."
This ignores:

- Whether the rain arrives today or tomorrow night.
- Crop stage and water requirement.
- Pots or beds protected from rain.
- Soil drainage and moisture retention.
- Irrigation method.

Recommended wording:

> Rain forecast tomorrow — review 4 watering jobs and check soil moisture.

Weather should annotate affected work; it should not automatically suppress or
contradict the task schedule. Field-specific precipitation, soil, and crop
conditions are central to irrigation decisions rather than rainfall alone:
[University of Minnesota Extension — Irrigation
management](https://extension.umn.edu/agricultural-soil-and-water/irrigation).

Weather should also display:

- The selected plot.
- Whether coordinates came from plot GPS, district fallback, or the application
  default.
- The forecast's last-updated time when it is stale or offline.

### 8. Seasonal content is repetitive and not completion-aware

The pre-monsoon checklist:

- Is a fixed list rather than real scheduled work.
- Returns every day during its 21-day window.
- Does not know whether work was completed.
- May recommend infrastructure work that is irrelevant to a plot.

Green manure can appear in the pre-monsoon list, the seasonal panel, and the Bed
Rotation experience. Almanac text can repeat mulch, drip-line, and Jeevamrutha
work already shown in the checklist.

Applicable seasonal work should become completable tasks. General education and
planning should move to a Seasonal Planning destination.

### 9. The empty state can contradict real risk

The screen displays "All caught up" when `tasks.length === 0`, even if a sick
plant, harvest-ready crop, rotation violation, or weather hazard remains.

Use distinct states:

- **No scheduled work remaining** when tasks are complete but conditions remain.
- **No urgent work found** only when tasks, observed issues, bed risks, and
  weather hazards are all clear and current.
- **Could not verify current status** when important data is stale or unavailable.
- A setup CTA when no plot, bed, or plant has been configured.

## Proposed selected-plot Home

The first screen should resemble this:

```text
Friday, 31 July                   [North Field ▾]

2 overdue · 5 remaining · 3 done
Rain tomorrow · Review 4 watering jobs

NEEDS ACTION
🔴 Tomato row · South Bed
   Sick · observation open for 2 days          [Inspect]

🟠 Bed 4
   Rotation conflict before next planting      [Review]

TODAY'S WORK
💧 Water · Chilli Beds 1–3 · Morning            [Done]
🧺 Harvest · Okra Row · Ready today              [Done]
🌿 Fertilise · Coconut Plot · 1 day overdue     [Done]

View all 7 jobs in Care Plan

NEXT 48 HOURS
Tomorrow · 4 jobs · 1 harvest window

[Log observation]  [Log harvest]  [Report issue]
```

### Information shown in the header

- Date.
- Selected plot or farm.
- Jobs remaining.
- Overdue jobs.
- Jobs completed today.
- One material weather impact.

The largest number should be **remaining**, not completed.

### Needs Action

This is a vertical, urgency-sorted list containing:

- Critical sick, stressed, pest, or disease observations.
- Time-sensitive harvest windows.
- Seriously overdue care.
- Rotation and harvest-gap risks.
- Bed-rest completion.
- Material weather and infrastructure risks.

Every item should include:

- Action: inspect, harvest, water, spray, prune, or review.
- Exact target: plant, row, bed, or farm-level item.
- Plot, section, and bed.
- Due state and preferred time.
- Reason for its priority.
- One primary action.

### Today's Work

This is a limited preview of scheduled work:

- Show approximately three to five items or batches.
- Group routine work by plot, section, bed, and activity to reduce walking.
- Keep critical individual crop issues separate from routine batches.
- Retain quick completion.
- Use `View all N jobs` to open the fully scoped Care Plan.

Care Plan continues to own:

- The complete schedule.
- Week and month planning.
- Search and filters.
- Grouping.
- Bulk completion and skip actions.
- Manual task creation.

### Next 48 Hours

Show this section only when it changes today's preparation:

- A large tomorrow workload.
- A harvest window.
- Rain-, heat-, or wind-constrained work.
- A deadline requiring inputs or equipment to be prepared.

Do not reproduce a full calendar.

### Quick field capture

Provide direct actions for:

- Log observation.
- Log harvest.
- Report pest or disease.
- Add a photo or note.

Do not add a recent-Journal feed to Home. The Journal tab already owns history.

Regular scouting and location-specific records are operationally important,
especially for early pest and disease response:
[Penn State Extension — Scouting for Pests and Diseases in Vegetable
Crops](https://extension.psu.edu/scouting-for-pests-and-diseases-in-vegetable-crops).
Production records should preserve what, when, where, and how much:
[University of Minnesota Extension — Recordkeeping for Specialty
Crops](https://extension.umn.edu/marketing-farm-products/recordkeeping-specialty-crops).

## Behaviour for one or multiple plots and farms

| Situation | Home behaviour |
| --- | --- |
| One farm, one plot | Hide the selector and show the selected-plot layout directly. |
| One farm, several plots | Default to `All plots`. Show one urgency-sorted row per plot, then allow the farmer to open a scoped plot Home. |
| Several true farms | `All farms` shows one summary row per farm: urgent issues, overdue jobs, harvest window, and weather exception. Selecting a farm reveals its plots and scoped work. |
| All-farms mode | Never display unlabeled mixed plant, bed, or task cards. Every item must show its farm. Do not show every farm's full forecast. |
| Selected-farm mode | All tasks, alerts, weather, completion counts, and deep links use the same farm scope. |

An All Plots or All Farms overview could look like:

```text
North Farm    2 critical · 6 due · heavy rain tomorrow
Backyard      Harvest today · 1 routine job
Coconut Farm  No urgent work
```

Rows should be sorted by consequence, not by raw task volume or creation date.

## Prioritisation model

### 1. Critical or irreversible

- Severe unresolved pest or disease.
- Sick crop with time-sensitive care.
- Harvest-quality window.
- Heat, heavy-rain, drainage, or infrastructure threat.

### 2. Weather-constrained

- Spraying before rain or in unsuitable wind.
- Watering that should be reviewed because of forecast rain.
- Transplanting during extreme heat.
- Harvesting before damaging rain.

### 3. Overdue care

Rank using:

- Explicit `priority_level`.
- Health condition.
- Growth stage.
- Days late relative to task frequency.
- Potential crop-loss consequence.

### 4. Due today

- Preferred-time work first.
- Then harvest, watering, treatment, and routine maintenance.
- Within the same priority, group by physical location.

### 5. Planning and advisory

- Green manure.
- Rotation planning.
- Sowing suggestions.

These should appear on Home only when plot-specific and genuinely time-bound.

## Deduplication contract

A single Home briefing model should replace the present independent blocks.

1. A task-backed condition produces one work item, not both a task and an alert.
2. Weather annotates or reorders affected work; it does not create a second
   watering instruction.
3. Sick plants, unresolved pests, rotation risks, and harvest readiness without
   a task become condition-only exceptions.
4. A seasonal recommendation remains in Planning until accepted.
5. Once accepted, a recommendation becomes a real task and disappears from
   recommendations.
6. A task escalated into Needs Action is removed from the routine work list.
7. Preview limits show the true total: `3 shown · 8 total · View all`.
8. "All clear" is allowed only when scheduled work, observed issues, bed risks,
   and material weather hazards are clear and current.

A suggested view model is:

```ts
interface TodayBriefing {
  scope: FarmOrPlotScope;
  jobSummary: {
    remaining: number;
    overdue: number;
    completed: number;
  };
  weatherImpact: WeatherImpact | null;
  criticalItems: TodayWorkItem[];
  routineItems: TodayWorkItem[];
  upcoming: UpcomingSummary | null;
  dataFreshness: DataFreshness;
}
```

The screen should consume this briefing rather than independently assembling
task summaries, alerts, health totals, bed cards, tips, and recommendations.

## Information that should not appear on Today

- Full bed inventory or a New Bed CTA.
- Full seven-day forecasts for every plot.
- Generic daily tips.
- Monthly almanac prose.
- An eight-crop sowing catalogue.
- Healthy plant totals.
- Zero-value task rows.
- Both a progress ring and per-type progress bars.
- Farm capacity statistics.
- Recent Journal history.
- Pest and disease reference catalogues.
- Farm goals and household profile.
- Another offline banner; the application already provides one globally.

## Information that belongs elsewhere

| Information | Correct destination |
| --- | --- |
| Full task schedule, filters, and bulk actions | Care Plan |
| Plant inventory and health filtering | Plants |
| Bed inventory, occupancy, creation, and editing | Beds |
| Rotation planning and bed transitions | Beds / Rotation |
| Observations, harvest history, photos, and issue records | Journal |
| Plot size, GPS, soil profile, and capacity | My Farm |
| Full pest, disease, and organic-input references | More |
| Almanac, sowing suggestions, seasonal rhythm, and green-manure planning | New Seasonal Planning destination |
| Full seven-day forecast | New forecast sheet or screen |

## Data required for true multi-farm support

The correct long-term model needs:

- Stable `farm_id`, `plot_id`, and optionally `section_id`.
- Farm name, district, agro-climatic zone, timezone, and coordinates.
- Stable Plot records rather than names used as keys.
- Farm and plot IDs on plants, beds, task templates, task logs, and journal
  entries.
- Explicit scope for farm-level and bed-level tasks.
- Sections scoped to a plot or farm rather than one globally shared list.
- Health-assessment timestamp and observer.
- Stable unresolved-issue status for pests and diseases.
- Weather source and fetched timestamp.
- Farm-scoped cache keys, dismissals, queries, and deep links.
- Optional task duration and assignee if labour workload or crews are later
  introduced.

Until task duration exists, the application should call the figures **jobs**,
not **workload**. One task for a pot and one task for a hundred-plant row are
currently counted equally.

## Delivery recommendation

### Release 1: farmer-first Home using the current schema

1. Treat `parentLocation` consistently as Plot.
2. Add an `All plots / selected plot` scope selector.
3. Scope linked plants, beds, tasks, health exceptions, and weather together.
4. Label unresolved farm-level work as Whole Farm or Unassigned.
5. Replace the hero with compact remaining, overdue, and completed job counts.
6. Merge due work and condition alerts into one canonical priority queue.
7. Include every task type.
8. Restore rotation and harvest-gap exceptions.
9. Reduce weather to a 24–48-hour operational impact.
10. Remove BedsQuickScroll, TipStrip, generic SeasonPanel content, and the
    duplicate bottom empty state.
11. Keep quick completion, deep links, cache-first behaviour, and Care Plan as
    the full schedule.

### Release 2: correctness and trust

1. Include actual unresolved Journal and plant health issues.
2. Add observation and scouting timestamps.
3. Fix counts for row records representing multiple plants.
4. Display accurate hidden-item totals.
5. Show weather source and stale-data state.
6. Replace automatic "skip watering" wording with review guidance.
7. Scope seasonal calculations and dismissals by plot.
8. Ensure pull-to-refresh updates tasks, issues, beds, plot configuration, and
   weather consistently.

### Release 3: true multi-farm foundation

1. Introduce stable Farm and Plot entities.
2. Migrate operational records to farm and plot IDs.
3. Store district, zone, and weather configuration per farm.
4. Add an Active Farm/Plot provider.
5. Make queries, caches, navigation filters, and offline mutations farm-aware.
6. Add an All Farms urgency overview.

### Release 4: optional operational intelligence

Only after the data supports it:

- Weather-aware task ranking.
- Estimated duration and daily labour capacity.
- Worker assignment.
- Route or visit ordering across separate farms.
- Input and equipment blockers.
- Farm-specific sowing opportunities using soil, space, crop goals, and season.

## Definition of done

The redesign is successful when:

1. A farmer can identify the next action and its location without leaving Home.
2. One underlying task appears as one actionable Home item.
3. Every All Plots or All Farms item identifies its location.
4. Viewing one plot's weather also scopes its tasks, beds, and issues.
5. Eight exceptions display the correct total, a limited preview, and a route to
   the remaining five.
6. A sick plant or rotation risk prevents the screen from claiming the farm is
   fully caught up.
7. Forecast rain asks the farmer to review watering rather than claiming it is
   safe to skip.
8. Stale or unavailable data is communicated instead of being treated as clear.
9. Inventory and reference content remain in their dedicated destinations.
10. The first viewport answers where to go, what to do, and what weather changes.

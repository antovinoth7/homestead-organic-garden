# Today screen redesign study

## Product decision

The Today screen should be a **decision surface, not a farm report**. Its first viewport should
answer, in order:

1. **Where am I working?** (all plots or one plot)
2. **What needs action now?** (overdue, due today, or weather-sensitive)
3. **What can wait?** (this week)
4. **What should I prepare for?** (this season)

The recommended redesign is Variation A, **Action-first Today**, with an explicit farm scope and a
small Today / Week / Season horizon switch. It preserves the app's useful weather, bed, alert, and
seasonal data while making the order and empty states match the grower's immediate question.

## What the current screen does well

The existing screen already has unusually rich ingredients:

- The hero combines the date, greeting, task completion, overdue work, activity types, and plant
  health in one visual block.
- Actionable alerts are derived from the same task source as the progress ring, reducing conflicting
  counts.
- Weather supports either one plot or a swipeable multi-plot deck.
- Bed previews, pre-monsoon preparation, a daily tip, seasonal rhythm, sowing suggestions, and green
  manure guidance create a credible organic-farming context.
- Cached tasks, plants, and logs support a fast offline-first first paint.

This is a strong _information dashboard_. The redesign opportunity is primarily hierarchy, scope,
and state design—not adding another set of cards.

## Current-screen gaps

### 1. Farm scope is implicit

The page aggregates tasks, plants, health, alerts, and beds across all data, but does not tell the
user that it is an all-farms view. Weather alone introduces a per-plot mental model through its
multi-card deck. A user with several plots can therefore see a task total, a weather card, and a bed
without a reliable answer to “which farm is this for?”

**Essential change:** put a persistent scope control directly below the greeting:

`All farms ▾` or `Kanyakumari Field ▾`

- One configured plot: show its name as a quiet label, not a dropdown.
- Multiple plots: default to **All farms**, remember the last selection, and offer plot chips or a
  bottom sheet.
- No configured plots: show **Set up your first farm** and avoid pretending the aggregate has a
  location.
- Every scoped module—tasks, alerts, beds, health, and weather—must use the same selection.
- In All farms, every actionable row needs a farm badge; repeated rows may be grouped by farm.

The current data model calls top-level farms `parentLocations`. Product copy should call them
**farms** or **plots** consistently; “parent location” should remain an implementation term.

### 2. Progress is more prominent than the next action

The largest area tells the user how much work is complete, but not what to do first. A grower opening
the app with wet weather approaching needs “Mulch Bed 3 before rain,” not a 2/7 ring. Progress is
useful feedback after action, but urgency, impact, farm, and estimated effort should determine the
work order.

**Essential change:** the first content card should be **Up next**, selected from overdue, due today,
and weather-sensitive tasks. It should expose Complete, Snooze/Skip, and View details. Keep progress
as a compact supporting line such as `2 of 7 done · 1 overdue`.

### 3. “No tasks” appears too late and says too little

When there are no tasks, the hero says “all clear,” but the dedicated empty state appears after
weather, beds, preparation, tips, and seasonal content. “No tasks due today” can mean at least four
different things:

1. The garden is genuinely caught up.
2. Plants exist but their care schedules are not configured.
3. The account has no plants/beds yet.
4. Tasks exist later this week or next season.

These states require different next actions. A celebratory generic empty state risks hiding an
incomplete setup.

**Essential empty-state matrix:**

| State                             | Headline                   | Supporting information                            | Primary action  |
| --------------------------------- | -------------------------- | ------------------------------------------------- | --------------- |
| No farm configured                | Start your first farm      | Add a plot so weather and advice become local     | Add farm        |
| Farm, no plants/beds              | Your farm is ready to grow | Start with a plant or lay out a bed               | Add plant       |
| Plants, no care schedules         | Nothing is scheduled yet   | Set care once; Today will remind you              | Set up care     |
| Nothing due today, work this week | Today is clear             | Next: Fertilise tomatoes, Thu                     | View this week  |
| Nothing due this week             | A quiet week               | Show weather opportunity and seasonal preparation | Plan the season |
| Everything completed              | All done for today         | Completed count and next due item                 | Add observation |
| Offline/stale                     | Showing saved farm data    | Last updated time; actions remain queued          | Retry sync      |

### 4. Today, week, and season are mixed in one long feed

The current vertical order interleaves immediate alerts, a seven-day forecast, beds, pre-monsoon
work, a daily tip, and a season panel. This makes useful content compete across time horizons.

**Essential change:** introduce `Today | This week | This season` as a compact segmented control.
Changing horizon should change prioritisation, not navigate to a disconnected page:

- **Today:** overdue + due today + weather-sensitive action, today weather, quick observation.
- **This week:** seven-day workload, forecast windows, upcoming harvests, and open capacity.
- **This season:** sow/harvest windows, rotation, soil/input preparation, and seasonal risks.

The Care Plan remains the full operational calendar. Today is its prioritised summary.

### 5. Multi-farm weather exists, but multi-farm workload does not

Weather has explicit multi-plot presentation while task progress and alerts remain globally merged.
This can cause a user to travel to the wrong plot or miss that one plot has all the overdue work.

**Essential change for All farms:** add a compact farm status strip:

`North Field  3 due · rain` &nbsp; `Backyard  clear` &nbsp; `Coconut Plot  1 overdue`

Selecting a farm scopes the whole page. Sorting should consider severity first, then a practical
farm route so a grower can finish work plot by plot rather than zig-zagging.

### 6. The page lacks effort, timing, and rationale

Task type and overdue state are available, but the user cannot quickly judge how long work will take,
why it is recommended today, or whether rain/heat changes the advice.

Add concise metadata when known:

- `10 min` or `3 plants`
- `Backyard · South bed`
- `Do before 11:00 AM` / `Rain expected this evening`
- `2 days overdue`

Do not fabricate precision. Unknown effort should simply be omitted.

### 7. Health and beds are summaries without a clear daily role

Health tiles and the bed carousel are valuable, but occupy prime space even when no change requires
attention. Healthy counts are reassurance; they are not usually a task.

**Essential change:** make routine health and beds collapsible under **Farm pulse**. Promote only
exceptions (new stress, harvest readiness, empty-bed opportunity) into the action feed. This reduces
scroll length without removing discovery.

### 8. Completion needs recovery and batching

Quick completion is correctly available on alert cards, but a high-trust daily workflow also needs:

- an undo toast after completion;
- “Complete all” only for truly homogeneous work (for example, water three plants at one farm);
- skip/snooze with a reason for work that should not be done;
- optimistic offline confirmation with a queued-sync indicator;
- an end-of-day completed section that is collapsed by default.

## Recommended information architecture

### Persistent top area

1. Date and greeting
2. Farm scope (quiet label for one farm; selector for multiple farms)
3. Horizon switch: Today / Week / Season
4. Offline or stale-data status only when relevant

### Today hierarchy

1. **Up next** — one highest-value action, with complete and secondary action
2. **Today queue** — remaining tasks grouped by farm, or by route within a selected farm
3. **Weather window** — decision phrasing such as “Water can wait; 12 mm expected”
4. **Needs attention** — exceptions not already represented as tasks
5. **Farm pulse** — compact health and bed summary
6. **Later** — next due item and completed-today disclosure

### This-week hierarchy

1. Seven-day workload bars with overdue carried separately
2. Best weather windows for sowing, spraying, transplanting, and irrigation
3. Upcoming harvests and care peaks
4. Farm-by-farm workload balance
5. Link to the full Care Plan

### This-season hierarchy

1. Current season and remaining window
2. Three recommended priorities, personalised to actual farm capacity
3. Sow now / prepare now / harvest soon
4. Rotation, resting-bed, soil, and organic-input readiness
5. Seasonal pest/disease risks that affect plants the user actually grows

## Variation A — Action-first Today (recommended)

**Best for:** most users; frequent, short visits; one or several farms.

```text
Wednesday, 29 July                       avatar
Good morning
[ All farms ▾ ]
[ Today ]  This week  This season

UP NEXT                                      1 overdue
Water chilli seedlings
Backyard · South bed · 8 plants             ~10 min
High heat by noon — water before 9 AM
[ Mark done ]                         [ Details ]

TODAY                                       2 of 5 done
○ Fertilise banana       North Field        15 min
○ Check aphids           Backyard
✓ Harvest okra           Backyard
[ View full care plan ]

WEATHER WINDOW
31° · Rain 6 PM   “Skip evening watering”

FARM PULSE
2 need attention · 6 beds active · 1 harvest ready

Next: Mulch coconut trees, Friday
```

**Why it works**

- Makes the next decision unmistakable.
- Farm context travels with each action.
- The horizon switch prevents seasonal advice from diluting today’s work.
- Scales to All farms by grouping the queue and adding farm badges.
- The no-task state can occupy the Up next area without being buried.

**Trade-offs**

- Less visual emphasis on overall garden health.
- Requires a transparent ranking policy and careful deduplication between tasks and alerts.
- Estimated effort and weather rationale need graceful optional states.

## Variation B — Farm command center

**Best for:** users managing several physically separate plots or delegating work.

```text
Good morning · Wednesday, 29 July
[ All farms ▾ ]       [ Today | Week | Season ]

FARMS
┌ North Field ─────────┐ ┌ Backyard ───────────┐
│ 3 due · 1 overdue    │ │ All clear            │
│ Rain 6 PM · 4 beds   │ │ 31° · 2 beds         │
└──────────────────────┘ └──────────────────────┘

ALL-FARM ROUTE                              5 tasks
1  North Field  Fertilise banana
2  North Field  Check drainage before rain
3  Backyard     Harvest okra
[ Start route ]

EXCEPTIONS
Chilli stressed · North Field
Bed 4 resting window ends this week

SEVEN-DAY OUTLOOK  ▂ ▅ ▃ ▇ ▂ ▂ ▄
```

**Behavior**

- Farm cards are the primary navigation and show comparable status metrics.
- Selecting one card scopes all following modules and provides a clear “Back to All farms.”
- All-farm mode groups work into a practical visit route.
- For a single-farm user, the farm-card rail disappears and the selected farm name becomes a label.

**Trade-offs**

- Excellent multi-farm visibility but heavier for a backyard grower.
- Route ordering is only credible when locations and task timing are sufficiently complete.
- Cross-farm totals can become dense; strict metric limits are necessary.

## Variation C — Garden pulse / calm dashboard

**Best for:** hobby growers, low task volume, and users motivated by progress and observation.

```text
Wednesday, 29 July
Your garden is in good shape                       82%
[ Backyard ]          Today  ·  Week  ·  Season

TODAY'S RHYTHM
Morning     Water 2 seedlings                 [Done]
Afternoon   Check shade cloth
Evening     Harvest okra

GARDEN PULSE
Healthy 24   Watching 2   Harvest ready 3
[ visual bed map / seasonal illustration ]

A GOOD DAY TO…
Photograph growth · Add an observation

COMING UP
Thu fertilise · Sat sow coriander · Mon mulch
```

**Behavior**

- Uses time-of-day rhythm instead of urgency-first ordering.
- When there are no tasks, it offers a meaningful lightweight action such as recording an
  observation, reviewing harvest readiness, or simply saying when the next task is due.
- Health and seasonal change become the emotional center while operational exceptions still pin to
  the top.

**Trade-offs**

- More inviting but less efficient for many overdue tasks.
- A composite health score must be explainable; otherwise prefer plain counts.
- Time-of-day grouping must not imply a required time when a task has no such constraint.

## Variation D — Weekly planner with Today focus

**Best for:** growers who visit farms only a few days each week and plan work in batches.

```text
This week · 27 Jul–2 Aug                 [All farms ▾]
[ Mon 2 ] [ Tue ✓ ] [ Wed 5 ] [ Thu 3 ] [ Fri 1 ] …
                     TODAY

WORKLOAD
Overdue 1  █
Today   5  █████
Later   4  ████

BEST WINDOWS
Wed AM   Water + transplant   dry, cooler
Thu PM   Sow green manure     rain follows
Sat AM   Spray neem           low wind

TODAY'S BATCHES
Backyard · 3 tasks                           ~25 min
North Field · 2 tasks                        ~40 min

SEASON MILESTONE
Pre-monsoon drainage prep · 2 of 4 complete
```

**Behavior**

- Opens on the current day but makes rescheduling and batching across seven days easy.
- Weather is translated into recommended work windows, rather than shown as a standalone forecast.
- Farm batches communicate travel cost and total workload.
- A single-farm user sees batches by bed/zone instead of farm.

**Trade-offs**

- Strong planning, weaker one-tap immediacy.
- Denser and more calendar-like; overlaps more with the existing Care Plan.
- Weather recommendations require conservative rules and clear explanations.

## Responsive rules by farm count

| Farm state | Header treatment        | Task treatment                       | Weather treatment                          | Bed treatment                |
| ---------- | ----------------------- | ------------------------------------ | ------------------------------------------ | ---------------------------- |
| Zero       | Setup prompt            | Explain why no work exists           | District fallback only if clearly labelled | Creation CTA                 |
| One        | Static farm name        | No redundant farm badge              | One compact decision card                  | Beds from that farm          |
| Two–four   | Dropdown + quick chips  | Group in All farms; badge when mixed | Selected farm first; swipe for others      | Scope to selection           |
| Five+      | Searchable bottom sheet | Group/collapse by farm; show counts  | Summary exceptions first                   | Avoid one unbounded carousel |

Scope should be stable across Today, Week, and Season. If the user switches from All farms to a
single farm, the app should preserve the selected horizon and scroll to the top with an accessible
announcement that the scope changed.

## Prioritisation model

Use a deterministic, explainable rank rather than an opaque “AI priority”:

1. Safety or crop-loss risk
2. Overdue duration
3. Weather deadline/opportunity
4. Due date and time window
5. Harvest readiness
6. Same-farm/same-bed batching
7. User-created priority

Never rank a general seasonal suggestion above an overdue care action. Avoid duplicate cards when an
alert and task describe the same work. A visible reason such as `Overdue 3 days` or `Rain at 6 PM`
should explain every promoted Up next item.

## Interaction and accessibility requirements

- Use text plus icon/color for overdue and health states; never color alone.
- Give farm scope, horizon tabs, complete, skip, and undo clear accessibility labels and selected
  states.
- Keep tap targets at least 44×44 points.
- Announce task completion and scope changes; move focus sensibly when the Up next card disappears.
- Respect reduced-motion settings for hero/progress animation.
- Do not hide task completion behind a swipe-only gesture.
- Preserve offline operation and distinguish queued completion from synced completion without
  alarming the user.
- Keep horizontal rails optional; critical information must not live off-screen in a carousel.

## Suggested delivery sequence

### Phase 1 — hierarchy without schema changes

- Add the farm-scope label/selector and filter existing tasks, plants, alerts, beds, and weather.
- Add the horizon switch; initially link Week to existing derived task windows and Season to the
  existing season panel.
- Move empty states immediately below the header and distinguish setup, unscheduled, caught-up, and
  completed states.
- Replace the large progress-first hero with compact progress and one Up next card.

### Phase 2 — better decisions

- Translate weather into action messages using conservative rule-based logic.
- Add next-due preview, completed-today disclosure, and farm/bed grouping.
- Deduplicate task-backed alerts from the task queue.
- Add undo and consistent skip/snooze flows.

### Phase 3 — planning and personalisation

- Add optional effort estimates and batch summaries.
- Add seasonal priorities based on owned plants, empty beds, rotation, and farm goals.
- Consider route ordering only after multi-farm usage validates the need.

## Success measures

Instrument outcomes rather than card taps alone:

- median time from opening Today to completing or opening the first task;
- percentage of sessions where the user understands/changes farm scope;
- overdue-task reduction after seven days;
- empty-state conversion to add farm, add plant, or configure care;
- task completion undo/skip rate (a signal of bad prioritisation);
- scroll depth required to reach the first actionable item;
- weekly return rate for single-farm versus multi-farm users.

The strongest launch test is: **can a user with three farms, and a user with one quiet backyard,
both understand their next useful action within five seconds?**

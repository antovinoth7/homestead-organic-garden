# Bed Management Journey Audit — Tamil Nadu Readiness

**Audit date:** 28 August 2026  
**Product scope:** Beds list, bed cards and filters, create/edit wizard, bed detail,
lifecycle actions, deletion, and farm-wide rotation  
**Geographic scope:** Tamil Nadu homestead and kitchen gardens, with an upgrade path for
small farms  
**Status:** Planning audit only — no recommendation in this document is implemented merely
because it appears here

## Executive verdict

The Beds feature has a strong technical and visual foundation. It has a first-class bed
entity, offline-aware reads and writes, consistent lifecycle derivation, search and filters,
delete undo, crop-row layout visualisation, plant linking, and reusable status logic across
Beds and Today. It is substantially more capable than a basic create/edit form.

The current product model nevertheless combines three things that change at different rates:

1. the **physical bed**, which may remain for years;
2. the **current crop cycle**, which changes each season; and
3. **agronomic advice**, which depends on crop, plot, weather, water, soil evidence, and local
   conditions.

That conflation is the main source of the usability and correctness problems below. A crop
category such as “Leafy Greens” is stored as the bed's permanent type, the type is locked in
edit mode, and the same value drives list identity, capacity, layout, rotation, seasonal fit,
and soil recommendations. This makes crop rotation look like editing the permanent bed rather
than closing one crop cycle and starting another.

**Product conclusion:** retain the existing visual and offline foundations, but separate the
stable physical bed from crop cycles before expanding the feature into a Tamil Nadu field
advisor. Until the P0 findings are corrected, the feature should be presented as a planning
aid rather than authoritative agronomic guidance.

## Review method and terminology

This audit follows the current user journey from the Beds tab into list actions, create/edit,
detail, lifecycle transitions, and rotation. Findings labelled **Observed defect** describe a
specific mismatch in shipped code. **Product recommendation** describes a proposed experience.
**Agronomic caution** identifies advice that needs stronger context or expert review. Proposed
types in this document are conceptual interfaces, not a committed Firestore schema.

The review covered the current components and their pure domain helpers, including
`BedListScreen`, `BedCard`, `useBedData`, `BedCreationWizardScreen`,
`useBedCreationWizard`, `BedDetailScreen`, `BedRotationView`, `bedStatus`, `bedLogic`, and the
bed configuration engines. Related documentation was used to distinguish intentional product
decisions from accidental drift.

## Current journey

| Stage        | Current behaviour                                                                                          | Useful foundation                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Beds entry   | Flat list, newest first, with search, filter sheet, pull-to-refresh, and FAB                               | Fast first load, route-applied plot/lifecycle filters, visible result counts  |
| Bed card     | Name, stored bed type, lifecycle pill, generic occupancy, one attention reason, optional legume percentage | Lifecycle presentation is shared with Today and detail                        |
| Card actions | Swipe right for edit/delete and left for rotation                                                          | Compact access and a four-second delete undo window                           |
| Create/edit  | Six steps: Crop Type, Your Land, Bed Size, Crops, Arrange, Review                                          | Strong layout preview, crop resolution, companion warnings, and draft cleanup |
| Bed detail   | Timeline, top-down layout, soil-input dates, transition advice, next crops, rotation score, rest action    | Rich context and a reusable read-only layout                                  |
| Rotation     | Farm score, legume percentage, green-manure banner, gap warnings, per-bed rules                            | A dedicated place for next-cycle planning already exists                      |

## What is already working well

- `getBedLifecycle` is the shared source for list cards, filters, detail, and Today, avoiding
  competing definitions of “growing”, “resting”, “empty”, and “permanent”
  ([`bedStatus.ts`](../src/utils/bedStatus.ts#L53)).
- Route filters from the Today plot card are applied to the list's real filter state and then
  cleared from navigation, so the result remains visible and clearable
  ([`BedListScreen.tsx`](../src/screens/BedListScreen.tsx#L177)).
- The list groups plants by bed in one pass instead of refiltering the full plant collection
  for every card ([`useBedData.ts`](../src/hooks/useBedData.ts#L52)).
- Search, sort, construction, status, sunlight, parent-location, and child-location filters
  share a pure filtering entry point with useful unit coverage
  ([`filterAndSortBeds.ts`](../src/utils/filterAndSortBeds.ts#L38)).
- Delete is visually optimistic and avoids a stale-data flicker while offering a short undo
  window ([`BedListScreen.tsx`](../src/screens/BedListScreen.tsx#L249)).
- Create/edit reuses the same row-layout engine for arrangement, save snapshots, and the detail
  map, which is a sound consistency goal.
- Plant entries distinguish placeholders, newly created plants, and links to existing records;
  edit reconciliation preserves linked row records.
- The existing Tamil Nadu planting registry already records geographic scope, establishment
  action, evidence IDs, review dates, and expiry instead of treating a planting rule as timeless
  ([`tamilNaduPlantingCalendar.ts`](../src/config/tamilNaduPlantingCalendar.ts#L17)).

These foundations should be reused. The recommendation is a domain correction and information
architecture change, not a wholesale replacement.

## Prioritised findings

### P0 — trust and data integrity

#### P0.1 Edit can silently replace the saved name and dimensions

**Observed defect.** `LandConditionsStep` starts with generated-name mode even when editing. On
mount it writes the generated name through `onChange`
([`LandConditionsStep.tsx`](../src/screens/BedWizardSteps/LandConditionsStep.tsx#L145)). Every
Step 2 change then recalculates Step 3 and writes the recommended dimensions
([`useBedCreationWizard.ts`](../src/hooks/useBedCreationWizard.ts#L556)). Consequently, entering
Step 2 for a bed with a custom name and size can mark the form dirty and replace both values
before the farmer deliberately edits either field.

**Required correction.** In edit mode, initialise the name control from the persisted naming
mode or treat the loaded name as custom. Recompute size only when a size-driving condition
changes and only if the user has not explicitly customised dimensions. Add an integration test
that visits every step and saves without modification, asserting a byte-equivalent bed payload.

#### P0.2 Accurate Solanaceae history makes the wizard impossible to complete

**Observed defect.** Step 2 fails validation whenever `prev_crop_family === 'solanaceae'`,
regardless of the proposed crops ([`bedWizardValidation.ts`](../src/hooks/bedWizardValidation.ts#L13)).
The farmer must change truthful history even when rotating to a non-Solanaceae crop. The same
historical field is also treated as a current rotation violation on list cards without comparing
it with the current family ([`bedStatus.ts`](../src/utils/bedStatus.ts#L75)).

**Required correction.** Preserve previous-crop history as fact. Evaluate rotation after the
candidate crop set is known. Block only a confirmed incompatible candidate; otherwise show a
contextual warning and safer alternatives. “Other”, “unknown”, “no previous crop”, and
“virgin/fallow” must be distinct values.

#### P0.3 The review promises bed tasks that this save path does not create

**Observed defect.** Review states that watering, Jeevamrutha, and weeding tasks “will be
created” ([`BedConfirmStep.tsx`](../src/screens/BedWizardSteps/BedConfirmStep.tsx#L197)). The
wizard does not call `syncBedTasksFromPlants`; the synchroniser only exists as an exported
service ([`BedTaskResolver.ts`](../src/services/BedTaskResolver.ts#L174)). Bed Detail then says
its soil-input dates are updated through those Care Plan tasks. This leaves the promise and the
detail workflow disconnected.

**Required correction.** Either remove the promise or synchronise selected bed tasks only after
the bed and all crop writes succeed. The review must show the exact enabled tasks and editable
frequencies. Input tasks must be opt-in rather than silently universal.

#### P0.4 Partial crop-save failures are hidden by successful navigation

**Observed defect.** Failed crop creates, links, or delete reconciliation set `wizard.error`, but
`submit` can still return the bed ID ([`useBedCreationWizard.ts`](../src/hooks/useBedCreationWizard.ts#L843)).
The screen navigates away whenever an ID is returned, and does not render `wizard.error`. The
farmer can therefore see a successful exit while the saved bed and crop list disagree.

**Required correction.** Return a structured save result that distinguishes full success,
partial success, and failure. Keep the user on a recovery screen for partial success, name the
failed crop operations, and offer retry or continue-with-bed-only. Do not create downstream bed
tasks until crop reconciliation is complete.

#### P0.5 Main-list counts do not represent physical plants

**Observed defect.** Dense sowings may be persisted as one `record_kind: 'row'` document with a
larger `plant_count`, but list enrichment counts documents
([`useBedData.ts`](../src/hooks/useBedData.ts#L69)). A row containing thirty amaranth plants can
therefore appear as “1 plant”. Occupancy divides that document count by a generic maximum
derived from the stored guild type ([`bedOccupancy.ts`](../src/utils/bedOccupancy.ts#L19)), not
the selected crop rows. Sorting by plant count and legume percentages inherit the same unit
ambiguity.

**Required correction.** Name and calculate separate measures: crop records, physical plants,
planted rows, and occupied planting slots. The main card should normally show current crops or
rows; show a physical-plant count only when it can be calculated consistently.

#### P0.6 Deletion scope is broader than its warning

**Observed defect.** The confirmation message counts only active plants
([`BedListScreen.tsx`](../src/screens/BedListScreen.tsx#L40)). `deleteBed` obtains all non-deleted
plants assigned to the bed and soft-deletes them; archived crop records are non-deleted and are
therefore included. Bed-level tasks are also deleted. The warning does not state that crop
history and inactive records are in scope.

**Required correction.** Make deletion a named archival operation by default. Before destructive
deletion, disclose active crops, archived crop records, tasks, logs, and photos separately.
Offer “archive bed and preserve history” as the normal action; reserve permanent deletion for a
separate archived-items flow.

### P1 — listing and daily management

#### P1.1 The list is inventory-first rather than work-first

**Product finding.** The default sort is newest, cards are a flat farm-wide list, and there is no
needs-attention sort or filter. Location is filterable but absent from the card. For routine
work, a farmer needs to answer “what must I inspect in this plot today?” before “which bed was
created most recently?”.

**Recommendation.** Default to plot-grouped presentation with urgent items first inside each
plot. Provide explicit views for Attention, All, Resting/ready, and Next-cycle planning. Preserve
name/area/newest sorts as secondary tools. Surface location on every card unless the current
group heading already supplies it.

#### P1.2 Useful preview data is calculated but unused in the main list

**Observed gap.** `useBedData` calculates up to three plant preview names and the dominant growth
stage ([`useBedData.ts`](../src/hooks/useBedData.ts#L73)). `BedCard` does not render either value;
they are used only by the Today mini cards. The main list instead repeats the broad stored bed
type and generic occupancy.

**Recommendation.** Show two or three current crop names and a stage/next-action label. Avoid
decorative crop imagery when a text label gives a clearer accessible summary. For an empty bed,
show “No active cycle” and the appropriate action rather than a crop-type identity.

#### P1.3 Attention wording is more certain than its evidence

**Agronomic caution.** “Needs water” is triggered when any plant schedule is overdue unless a
recent bed-level water date overrides it. It does not observe root-zone moisture, standing
water, plot rainfall, irrigation method, or emitter delivery. In mixed beds, the shortest plant
interval can also overstate the need for the entire bed.

**Recommendation.** Use “Review watering” until moisture or a confirmed watering plan supports
a stronger instruction. List the reason: schedule due, hot/dry forecast, missing log, or observed
dry soil. Heavy-rain conditions should lead with drainage inspection rather than watering.

#### P1.4 Swipe actions are hidden and rotation ignores the selected bed

**Observed defect.** Swiping a bed for Rotation passes a bed into `handleRotation`, but the
parameter is ignored and navigation opens the farm-wide screen
([`BedListScreen.tsx`](../src/screens/BedListScreen.tsx#L322)). This violates the selected-row
mental model.

**Recommendation.** Make the primary tap open Bed Detail, provide a visible overflow action for
edit/archive, and use a labelled “Plan next cycle” action for that bed. Keep farm-wide planning
as a header-level destination, not a row gesture.

#### P1.5 Bed Detail is rich but not an operational home

**Product finding.** Detail leads with season timeline and layout, while current condition and
common logs are read-only farther down the page. It offers no direct log-water, drainage,
observation, harvest, or cycle-close action. Soil input dates depend on Care Plan tasks that may
not exist. Advice and a rule score occupy more space than observed farm state.

**Recommendation.** Recompose detail in this order:

1. **Today:** condition, actionable exceptions, and last observation;
2. **Quick actions:** log irrigation/rain, record standing water, observation/photo, harvest,
   and crop issue;
3. **Current cycle:** crops, stages, layout, planted date, and expected clearing window;
4. **This week:** enabled tasks and weather-qualified review prompts;
5. **History:** completed cycles, inputs actually applied, yield, and issues;
6. **Next cycle:** close/clear current cycle, rest with a reason, or plan the next crop.

#### P1.6 Resting is a fixed toggle rather than a crop-cycle transition

**Observed defect.** Detail marks a bed as resting for 45 days without requiring a reason or
checking for active crops ([`BedDetailScreen.tsx`](../src/screens/BedDetailScreen.tsx#L57)). Since
resting outranks growing in lifecycle precedence, a bed can display “Resting” while still holding
active plants.

**Required correction.** Rest must be a cycle state with a start reason, planned end condition,
and optional cover/green-manure crop. Closing a cycle should first reconcile annual, perennial,
failed, moved, and still-growing crops. Duration should be recommended from the actual problem
and next plan, then confirmed by the farmer.

### P1 — rotation correctness

#### P1.7 Bed Detail's harvest-gap section cannot receive a cross-bed warning

**Observed defect.** Detail calls `getHarvestGapWarnings([bed])` with a one-bed array
([`BedDetailScreen.tsx`](../src/screens/BedDetailScreen.tsx#L129)). The helper requires at least
two beds of the same type, so the section is unreachable.

**Required correction.** Either load the required farm context or remove the section from
single-bed detail. A correct warning must be derived from real projected harvest/clearing
windows, not bed type alone.

#### P1.8 The “within 21 days” claim has no date calculation

**Observed defect.** `getHarvestGapWarnings` groups beds by stored type and flags every bed when
the group contains at least two ([`bedLogic.ts`](../src/services/bedLogic.ts#L65)). It assigns the
literal range `current` to `next_season`; no crop maturity or clearing date is compared. The
rotation UI nevertheless says the beds clear within 21 days.

**Required correction.** Remove the warning until every active crop cycle has a defensible
harvest/clear range. Later, compute supply gaps by harvest category, household need, succession
window, and uncertainty—not simply matching guild labels.

#### P1.9 The SW-monsoon countdown becomes negative after onset

**Observed defect.** `getDaysToSWMonsoon` always subtracts today from 1 June of the current year
and explicitly returns a negative value after that date
([`preMonsoonTasks.ts`](../src/utils/preMonsoonTasks.ts#L16)). `BedRotationView` displays the value
unconditionally next to the current season. During the SW monsoon it can therefore say “SW
monsoon in -88 days”.

**Required correction.** During the active season show progress/end timing or omit a countdown.
Before onset show days to onset; after the season show the next locally relevant planning
window. Use the resolved zone and reviewed planting/advisory data.

#### P1.10 Rotation scoring treats optional practices as universal rules

**Agronomic caution.** The coordinator requires two crop families in every bed, an accumulator
such as Moringa/Agathi/Comfrey/Banana, a fixed legume percentage for selected bed types, no
high-severity history, and a previous-family check. A valid monocrop or small annual bed can
therefore receive a poor “rotation health” score because it does not contain a perennial tree or
mixed family. A severe historical pest also fails forever rather than recording diagnosis,
treatment, recurrence, or a suitable non-host cycle.

**Recommendation.** Remove the compliance score. Present evidence-backed constraints and
options for the proposed next crop:

- previous host family versus candidate family;
- row-level cycle history;
- confirmed soil-borne problem and non-host requirements;
- active perennial crops that must remain;
- crop-specific planting window and establishment method;
- water, drainage, space, and trellis constraints;
- confidence, evidence scope, and review expiry.

Archived plants must not be counted as current crop coverage, and row records must have an
explicit weighting policy.

### P2 — domain model

The following interfaces are **proposed concepts only**. They are not current public APIs and
must not be added without a separate schema/migration plan.

#### `Bed`: stable physical asset

- stable ID, plot ID, section, farmer-facing name;
- construction form: raised, flat, ridge-and-furrow, pandal/trellis, nursery, or
  terrace/container as applicable;
- width, length, height, accessible sides, path/channel dimensions, and orientation;
- drainage outlet/standing-water characteristics;
- irrigation method, water source, and infrastructure;
- trellis, shade-net, fence, or perennial-boundary infrastructure;
- inherited plot soil-profile reference plus explicit bed overrides;
- archived/active state independent of current crops.

#### `BedCycle`: planned, current, resting, or closed crop cycle

- bed ID, status, planned/start/sow/transplant/clear dates;
- crops, cultivars, row/slot layout, counts and establishment method;
- monocrop, mixed crop, succession, intercrop, cover crop, or green manure;
- expected harvest/clear range with its evidence and uncertainty;
- close reason: final harvest, failure, moved, removed early, or replaced;
- rest purpose and end condition;
- yield and outcome summary;
- immutable link to the previous cycle for rotation analysis.

#### `BedObservation`: observed conditions and performed actions

- observed-at time and observer-entered notes/photos;
- root-zone moisture and standing-water presence/duration;
- irrigation/rain, mulch, weed, cultivation, and input actions;
- pest/disease observation, status, and any confirmed diagnosis;
- harvest quantity/quality;
- evidence that distinguishes an observation from generated advice.

The current `Bed` record can remain readable during migration. A future migration should create
one active cycle from existing row layout and plants, then derive closed cycles from archived
plants and row history where dates are sufficient. Ambiguous history must be marked unknown,
not invented.

## Recommended experience

### Beds list

- Default to groups by plot/section, with urgent exceptions before routine beds.
- Offer top-level views: Attention, All beds, Ready/resting, and Next-cycle planning.
- Show current crops/rows and meaningful stage or condition instead of the permanent guild
  label.
- Show location, bed form, and honest units. Avoid a capacity bar until the denominator comes
  from the active crop layout.
- Display “Review watering” with its cause rather than asserting observed thirst.
- Keep search and existing lifecycle/location filters; add attention reason and crop filters.
- Use visible or overflow actions for plan next cycle, edit physical bed, archive, and delete.

### Four-step creation

1. **Place** — select plot and section, inherit the plot profile, and generate a non-destructive
   default name.
2. **Build** — choose physical form, dimensions, height/access, drainage, irrigation, and
   infrastructure. Explain recommendations and allow measured overrides.
3. **Plant now or later** — create an empty bed, prepare/rest first, plan crops, or record crops
   already growing. Crop suggestions come from crop/zone/plot constraints, not a broad bed type.
4. **Review and activate** — show the saved physical bed, optional crop cycle, required setup,
   opt-in task templates, and conditional cautions. Save results must distinguish full and
   partial success.

### Editing and cycle changes

- “Edit bed” changes only physical/location/profile data and never rewrites a crop cycle.
- “Manage current cycle” changes rows and current crops with explicit move/archive/delete
  semantics.
- “Close cycle” records outcome and preserves history before starting a rest or next plan.
- “Plan next cycle” evaluates candidate crops against history and current local evidence.
- Bed type is no longer a locked physical identity; crop-plan labels change per cycle.

### Bed Detail

Use Bed Detail as the operational home, not a read-only report. Lead with observed condition and
quick logging, follow with current-cycle layout and jobs, then history and next-cycle planning.
Keep the existing top-down visual as a secondary current-cycle view.

### Rotation

Rename the farmer-facing concept to **Next-cycle planning** unless the screen is genuinely
showing a multi-cycle rotation. Replace the farm score with:

- beds becoming available, grouped by expected clear range;
- candidate crops and explicit conflicts per bed/row;
- succession/supply gaps computed from real crop dates;
- optional green-manure/cover-crop plans where time, moisture, and purpose fit;
- evidence source, geographic scope, review date, and uncertainty.

## Tamil Nadu readiness

Tamil Nadu cannot be represented by one hidden Kanyakumari default. State material separates
agro-climatic areas by rainfall, soil, irrigation pattern, and cropping pattern; plot conditions
still override a zone average. The product should resolve district to advisory zone, then use
plot GPS/profile, current observations, forecast, water source, and crop requirements.

The repository already contains an evidence-expiring crop-window registry through
`getTamilNaduPlantingWindows` ([`tamilNaduPlantingCalendar.ts`](../src/config/tamilNaduPlantingCalendar.ts#L225)).
The bed flow should consume that registry rather than maintain its separate hardcoded
bed-category season-fit matrix.

### Locally appropriate planning patterns

TNAU kitchen-garden guidance supports a more locally recognisable set of templates: annual
plots, ridges and furrows, perennials at the boundary to reduce shading, climbers trained on
fences/trellises, and explicit direct-sown versus transplanted crops. Candidate product
templates, each still requiring source-backed rules, are:

- Keerai succession bed;
- fruiting-vegetable raised or paired-row bed;
- ridge-and-furrow annual vegetable plot;
- pandal/gourd bed;
- well-drained rhizome bed for turmeric or ginger;
- nursery bed;
- perennial boundary planting;
- coconut-understory bed;
- locally reviewed mixed maize–pulse–creeper plan.

“Three Sisters” may remain an optional mixed-cropping example, but it should not be the primary
Tamil Nadu identity. Moringa, Neem, Curry Leaf, Agathi, Banana, and other long-lived plants must
not be universally required inside a small annual vegetable bed.

### Advice rules

- A physical recommendation must state which inputs drove it: plot drainage, soil texture,
  slope, crop, rain exposure, irrigation, and access.
- Raised beds are not a statewide hidden default. For example, TNAU gives a crop-specific 1.2 m
  raised-bed and paired-row drip layout for Brinjal; that does not establish the same form for
  every crop and zone.
- Soil amendment quantities should come from current soil-test values and crop requirements.
  pH alone is insufficient; EC, organic carbon, macro/micronutrients, formulation, and amendment
  purpose may matter.
- Green manure should be selected by purpose, available moisture, soil condition, time before
  the next crop, and locally available seed—not month alone. Sunnhemp does not tolerate
  continuous waterlogging, while Dhaincha has different moisture tolerances.
- Jeevamirtham, Panchagavyam, wood ash, Neem cake, microbial products, and other inputs must be
  optional, crop/context-specific, and label/formulation aware. “Organic” must not be presented
  as automatically harmless.
- Crop rotation is a candidate-versus-history decision. A fixed 10- or 14-day rest does not
  resolve a soil-borne disease or nematode problem; use confirmed-host and non-host guidance.
- Weather prompts should ask the farmer to inspect soil or drainage unless the app has enough
  observed data to prescribe an action.

## Delivery priorities

| Phase | Goal                             | Required outcomes                                                                                                                                                                                                      |
| ----- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0    | Restore trust and save integrity | Preserve edit name/size; candidate-aware rotation validation; truthful task review; structured partial-save recovery; honest row/count units; deletion scope disclosure; integration tests                             |
| P1    | Make Beds operational            | Plot/attention-first list; visible current crops and location; selected-bed next-cycle action; direct condition/harvest logs; cycle-aware rest/clear; remove false gap/countdown/score claims                          |
| P2    | Separate bed and crop cycle      | Introduce versioned BedCycle/Observation schema through a dedicated migration; preserve unknown history; adapt list/detail/tasks/rotation to active cycles; retain legacy reads during rollout                         |
| P3    | Tamil Nadu intelligence          | Reuse evidence-expiring zone crop windows; inherit plot soil/water profiles; add crop-specific establishment and local templates; connect weather/observations; obtain TNAU/KVK-equivalent review before expert claims |

## Test and acceptance scenarios

### P0 regression coverage

1. Load a custom-named, custom-sized bed, visit all edit steps, and save without changes; no
   persisted field changes.
2. Record previous Solanaceae and choose a non-Solanaceae candidate; history remains unchanged
   and the plan can proceed.
3. Choose a same-family candidate; the correct candidate-specific warning appears.
4. Simulate one failed crop write; remain on a recovery result and do not create dependent bed
   tasks.
5. Render specimen and row records; every displayed count states and calculates the intended
   unit.
6. Delete/archive a bed containing active and archived records; the confirmation names the full
   scope and history is recoverable under the selected action.

### Journey acceptance

1. A farmer can create and save an empty physical bed without inventing crops.
2. A farmer can close one cycle and start another without changing the physical bed identity.
3. List, Today, and Detail derive the same lifecycle and attention state.
4. A row action opens planning for that row's bed; farm-wide planning is separately labelled.
5. Rest cannot conceal active crops without an explicit mixed/perennial decision.
6. No harvest-gap message is shown without real candidate dates.
7. No monsoon countdown is negative or borrowed from an unresolved zone.
8. No agronomic input is auto-enabled solely because it is organic or traditional.
9. Source-expired Tamil Nadu planting advice is withheld, matching the existing registry policy.

### Audit/document acceptance

- Every current-state claim above maps to a repository path or named symbol.
- Proposed interfaces and screens are labelled unshipped.
- Agronomic statements are phrased as scoped guidance or cautions, not guarantees.
- External evidence records publisher, title, scope, and review/access date.

## Evidence reviewed

All web sources below were accessed for this audit on **28 August 2026** unless the repository's
existing evidence registry records the earlier 16 August 2026 review. Source review is not the
same as agronomist approval.

| Publisher and source                                                                                                                                                                                                                           | Scope and audit use                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Government of Tamil Nadu, [Agriculture Budget 2021–22 — agro-climatic zones](https://agritech.tnau.ac.in/govt_schemes_services/pdf/2021/agri_e_pn_2021_21.pdf)                                                                                 | Tamil Nadu; supports zone differences in rainfall, soil, irrigation, and cropping context                                      |
| Tamil Nadu Agricultural University, [Tamil Nadu agrometeorological advisory zone bulletin](https://agritech.tnau.ac.in/agrometeorologicaladvisory/pdf/State%20comp%20AAS%20Bltn%20dtd.%2011.02.25.pdf)                                         | Tamil Nadu advisory zones; existing repository evidence reviewed 16 August 2026 and valid in the registry until 16 August 2027 |
| Tamil Nadu Agricultural University, [Home and roof garden crop selection and raising](https://agritech.tnau.ac.in/horticulture/horti_Landscaping_types%20of%20garden.html)                                                                     | Tamil Nadu home/roof gardens; crop establishment and planting windows                                                          |
| Tamil Nadu Agricultural University, [Kitchen gardening](https://agritech.tnau.ac.in/horticulture/horti_Landscaping_kitchengarden.html)                                                                                                         | Tamil Nadu kitchen gardens; plot layout, perennial boundaries, trellised gourds, direct sowing, and transplanting              |
| Tamil Nadu Agricultural University, [Brinjal irrigation and field layout](https://agritech.tnau.ac.in/horticulture/horti_vegetables_brinjal_irrigation.html)                                                                                   | Crop-specific raised-bed, paired-row, and drip example; not a universal bed rule                                               |
| Government of India, Soil Health Card, [scheme FAQ](https://soilhealth.dac.gov.in/files/FAQ_Final_English.pdf)                                                                                                                                 | Holding-level pH, EC, organic carbon, macro/micronutrient status, and crop-based recommendations                               |
| Tamil Nadu Agricultural University, [Agronomy of green manure crops](https://www.agritech.tnau.ac.in/agriculture/agri_greenmanuring_agronomygreenmanures.html)                                                                                 | Moisture, season, duration, and waterlogging differences between green-manure choices                                          |
| Tamil Nadu Agricultural University/Tamil Nadu organic-farming study, [State of Organic Farming in Tamil Nadu — 2026](https://agritech.tnau.ac.in/org_farm/pdf/State%20of%20Organic%20Farming%20in%20Tamil%20Nadu%20-%20KSS%202026%20Final.pdf) | Tamil Nadu farmer-practice diversity and context-dependent Jeevamirtham/Panchagavyam use                                       |
| Tamil Nadu Agricultural University, [Tomato root-knot nematode management](https://agritech.tnau.ac.in/horticulture/horti_vegetables_nematode_tomato_pest%20practices.html)                                                                    | Crop-specific non-host rotation and integrated management; demonstrates why a generic short rest is insufficient               |

## Related repository reviews

- [`BED_TAB_ROADMAP_ALIGNMENT.md`](BED_TAB_ROADMAP_ALIGNMENT.md) reconciles the shipped Bed tab
  with Phase B2 but is not a Tamil Nadu agronomy audit.
- [`tamil-nadu-reference-audit.md`](tamil-nadu-reference-audit.md) covers pest, disease,
  organic-input, and Today seasonal-reference quality.
- [`TODAY_SCREEN_RECOMMENDATION.md`](TODAY_SCREEN_RECOMMENDATION.md) defines the operational
  boundary between Today's exception queue and deeper Bed/Rotation planning.

## Final recommendation

The product should create the physical bed once, manage explicit crop cycles repeatedly, and
make Bed Detail the place to observe and act. The list should prioritise plot and attention, and
the planning experience should evaluate a proposed crop against real cycle history and reviewed
Tamil Nadu evidence. This direction preserves the strongest existing work—offline behaviour,
layout visualisation, shared lifecycle logic, and evidence-aware planting rules—while removing
the false certainty created by permanent guild types, generic scores, and universal schedules.

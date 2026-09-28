# Domain Logic

The Today seasonal experience supports all 38 Tamil Nadu districts. Other older features may still carry Kanyakumari-specific defaults; do not let those defaults enter Today guidance.

## Agro-Climatic Zone System

Season logic, watering multipliers, and pest alerts are parameterized by zone config rather than hardcoded.

- **Zone definitions**: `src/config/zones/` — each zone exports an `AgroClimaticZone` object.
- **Legacy default zone**: `HIGH_RAINFALL_ZONE` (Kanyakumari) remains for backward compatibility outside Today.
- **Zone registry**: `src/config/zones/index.ts` — `getZoneById(id)`, `getZoneByDistrict(district)`, `DEFAULT_ZONE`.
- **Today consumer pattern**: Resolve the saved district with `resolveActiveZone()` and pass the result explicitly. An unknown or missing district must display setup guidance, never use the legacy default.
- **Adding a new zone**: Create a new file in `src/config/zones/`, register it in `src/config/zones/index.ts`.

### Season Model

Every Tamil Nadu zone uses the IMD meteorological boundaries: Winter (`cool_dry`, Jan–Feb), Pre-monsoon (`summer`, Mar–May), SW Monsoon (Jun–Sep), and NE Monsoon (Oct–Dec). Crop pattam/window labels are separate planting-rule metadata and are not season names.

### Catalog growing-season vocabulary

`GROWING_SEASON_OPTIONS` (`src/utils/plantLabels.ts`) drives the catalog's Growing season picker and variety season pills. It uses the season model's English names, not Kharif/Rabi, which Tamil Nadu farmers don't use: Year Round, SW Monsoon (Jun–Sep), NE Monsoon (Oct–Dec), Winter (Jan–Feb), Summer (Mar–May), and three combinations. Each option carries its pattam as `description` (the picker's second line, e.g. "Aadi pattam"), plus a Tamil-script `tamilLabel` that is reserved for the Phase G toggle and not rendered yet.

- Retired values (`Kharif (Jun–Sep)`, `Rabi (Oct–Jan)`, …) live in `LEGACY_SEASON_VALUES`. `normalizeSeasonValue()` maps them onto the new ones, and migration 015 rewrote the stored catalog overrides.
- `growingSeason` is still free text. Many bundled profiles say e.g. `Southwest Monsoon (Jun–Sep)`. Display it with `growingSeasonLabel()`, which falls back to the raw text instead of blanking it.
- `mapSeasonTextToIds()` (`src/utils/plantingNow.ts`) still recognises `kharif`/`rabi` in old text. `Winter` maps to `cool_dry` only, while `Rabi` and `Cool Dry` also imply `ne_monsoon`.

### Catalog rows, varieties and harvest figures

- **One row per crop.** A cultivar or a type of the same species is a variety, not a row: Long Brinjal is a Brinjal variety, French Beans a Beans one, Red Banana a Banana one, Yardlong Beans a Cowpea one, and there is one `Coconut` row whose varieties are the palm types (migration 017). The old names stay as search aliases and share the survivor's photo.
- **Built-in names are fixed.** A bundled plant's catalog name cannot be edited (its pests, photo and care data are keyed by it); the local name goes in `tamilName`. Saving rejects any alias of an existing plant (`findDuplicatePlantName`).
- **Harvest shown to farmers.** For `fruit_tree`, `coconut_tree` and `timber_tree`, `daysToHarvest` is fruit development (Mango "90–150 days"), so the list and Quick Info show `yearsToFirstHarvest` instead when set — "First harvest in 5 years". Everything else reads "Harvest in 55–70 days". A `0–0` range means "not applicable" and is shown as nothing.
- **Rows adopted from users' own entries.** Lychee, Citron, Batoko Plum and Broccoli were added as rows because gardens grow them (migration 018 moves existing entries onto them). Their care figures are general horticulture, not TNAU-reviewed. Known unmodelled gap: lychee needs a cool, dry spell to flower and often stays barren in the Kanyakumari plains. The description says so, but nothing zone-aware suppresses its flowering or harvest estimates.
- **Linked pests and diseases** a farmer adds on a catalog entry (`customPests` / `customDiseases`) are also listed on each garden plant's care guide, after the built-in ones (`withLinkedNames`).

### Today planting and advisory model

- `tamilNaduPlantingCalendar.ts` is the source-reviewed rule registry. Rules carry zone scope, establishment action, window, conditions, maturity measured from that action, evidence IDs, and review date.
- Evidence expires closed: Today hides recommendations when the review date has lapsed.
- Citations live in `TODAY_AGRONOMY_EVIDENCE` and are mirrored in `docs/tamil-nadu-reference-audit.md`. In the app they surface on the catalog plant detail screen, which every Today crop tile opens; the Today card itself prints no source line.
- `todaySeasonalAdvisories.ts` contains non-diagnostic risk rules. A rule must match the resolved zone, current season, and an active host crop.
- Seasonal possibilities never enter `FarmAlert` as `pest_spotted`; that stream is reserved for actual observations.
- Missing values remain omitted. Images are illustrative and are never diagnostic evidence.

---

## Plant Classification — three axes, deliberately separate

A plant is classified three different ways, and conflating them is what made the
old catalog pills read wrong.

| Axis | Type | Lives in | Answers |
| --- | --- | --- | --- |
| **Care model** | `PlantType` | persisted as `plant_type`; care defaults, pest sets, task cadence | *How do I look after it?* |
| **Browse group** | `CatalogGroup` | `src/config/plants/catalogTaxonomy.ts` | *What do I harvest it for?* |
| **Habit + tags** | `PlantHabit`, `PlantTag` | same file | *What shape is it, and what else is it good for?* |

- **`PlantType` is the care model, not a category.** Its eight values include
  `shrub` (a growth habit) and `coconut_tree` (one species), which is why it does
  not make a sensible set of browse pills. It is persisted on every garden plant,
  so its values are a data contract — change it only with a migration.
- **`CatalogGroup` owns the pills**: Vegetables, Greens, Fruits, Spices, Herbs &
  Medicinal, Flowers, Support & Input Plants, Plantation & Timber. Purpose is the
  one axis a farmer and a cook agree on. Every group is mutually exclusive.
- **Creating a catalog entry asks for the group, not the care model.** The new
  entry's *Category* row lists the eight groups; its care model follows from
  `CATALOG_GROUP_DEFAULT_TYPE`, and Fruits alone adds a *Grows as* row (Tree →
  `fruit_tree`, Not a tree → `vegetable`). The chosen group is saved as the
  optional `PlantProfile.group` and passed to `getTaxonomy(name, type, group)`,
  which uses it only when no catalog row matches — so a user-added spice files
  under Spices, not under its care model's Herbs & Medicinal. Entries saved
  before this carry no group and still fall back to `PLANT_TYPE_TO_GROUP`.
- **Tags carry what one hierarchy cannot.** Drumstick is a tree harvested as a
  vegetable; Agathi is green manure, keerai and living fence at once;
  `coconut_intercrop` spans six plants in four groups that together make up a
  Kanyakumari thoppu planting.
- **`cropFamily` is derived, never hand-assigned** — from each care profile's own
  `taxonomicFamily` through `BOTANICAL_TO_CROP_FAMILY`. It drives bed rotation
  (`src/config/beds/cropFamilyRotation.ts`), so only families that hold crops
  grown in a rotated bed get their own value; trees and palms map to `other`,
  which the rotation check treats as "no signal" rather than as a shared family.
- **`catalogTaxonomy.test.ts` is the drift guard.** Adding a plant to the catalog
  without classifying it fails the build — the same discipline the alias table
  earned after three partial copies of it had to be merged.

### Lifecycle

`deriveInstanceLifecycle` reads the catalog's own `lifecycle` first and falls back
to `PlantType` only for a plant with no care profile. The result is persisted as
`lifecycle_type`, and only `perennial` plants get the recurring harvest-leaves
task, so the distinction is not cosmetic: a banana stand and a mango tree are both
`fruit_tree` but only one is ratooned.

## Plant Helpers

`src/utils/plantHelpers.ts` contains important domain behavior for:

- Expected harvest dates
- Companion planting
- Pest and disease suggestions
- Coconut age-based care guidance
- Coconut nutrient deficiency guidance

`src/utils/plantCareDefaults/` (directory module — type defaults, variety lists, per-category override shards in `overrides/`, pruning data; assembled by its `index.ts`) provides:

- Plant care profiles
- Pruning techniques
- Static pruning defaults

---

## Season Helpers

`src/utils/seasonHelpers.ts` functions accept an optional `zone?: AgroClimaticZone` param. They default to `DEFAULT_ZONE` for backward compatibility.

Watering frequencies, seasonal pest alerts, and reminders are all zone-aware.

---

## Harvest Readiness

Two surfaces prompt a harvest, and they now share one rule. `isHarvestSatisfied`
in `src/utils/harvestStats.ts` is the single definition of "already harvested",
called by both `computeHarvestsReady` (the Care Plan's Harvest Ready section)
and `alertsLogic.ts` (the Today screen's `harvest_due` card). Each caller keeps
its own day arithmetic — the alerts path measures from device-local midnight,
the Care Plan from farm-timezone date keys — so the shared helper takes day
offsets rather than dates.

A harvest reaches both surfaces from either write path: the journal entry the
farmer logs, or `last_harvest_date` stamped when a harvest task is completed.
Creating a harvest journal entry also stamps the plant and closes any
already-due harvest task through `markTaskDone` (`applyHarvestSideEffects` in
`src/services/journal.ts`), so recording a harvest one way is not invisible to
the other.

### Regional scope — a known gap

**Harvest dates are zone-blind.** Neither `calculateExpectedHarvestDate`
(`plantHelpers.ts`) nor `getDaysToHarvestRange` (`timelineHarvest.ts`) receives a
district, zone, or sowing window, so the same crop predicts the same harvest date
in the Nilgiris and in Kanyakumari. The readiness constants —
`READY_WITHIN_DAYS` (7), `HARVEST_HORIZON_DAYS` (30),
`CUT_AND_COME_AGAIN_INTERVAL_DAYS` (14), the `harvest_leaves` cadence in
`tasks.ts` (14), and the 55–75 day fallback range — are fixed values with no
agronomic citation and no zone parameterisation.

`TAMIL_NADU_PLANTING_RULES` (`src/config/tamilNaduPlantingCalendar.ts`) already
holds source-reviewed `maturityDays` per crop **per establishment window**,
anchored to sowing or transplanting and carrying evidence ids with an expiry —
and no harvest code consults it. Note the two are not interchangeable as they
stand: a planting rule's maturity is measured from its own action (Brinjal
transplant, 45–60 days), while a care profile's `daysToHarvest` is not
anchored to one. Reconciling them is tracked as **G5** in
`docs/IMPLEMENTATION_ROADMAP.md`.

**Nine rows carry hand-authored harvest windows.** Knol Khol, Lablab Bean,
Winged Bean and Sword Bean (`vegetable`), and Water Spinach, Ponnanganni Keerai,
Vallarai Keerai, Manathakkali Keerai and Mustard Greens (`spinach`) had botanical
identity but no agronomy, so they fell through to bare type defaults and browsed
as "Annual · Annual". `src/utils/plantCareDefaults/overrides/tamilNaduAgronomyGaps.ts`
now gives them a full care profile. Its `daysToHarvest` figures come from TNAU
and Tamil Nadu home-garden practice and each names the establishment action it is
anchored to (sowing, cutting or slip) in a comment — but they are **not**
zone-parameterised and carry **no evidence id or review expiry**. None of the
nine appears in `TAMIL_NADU_PLANTING_RULES`, so unlike the crops there they have
no per-establishment-window maturity to reconcile against. Closing that is part
of **G5**.

What *is* regionally grounded: `getCoconutAgeInfo` (`plantHelpers.ts`) follows
TNAU age stages and supplies the coconut harvest cadence, and
`getDefaultHarvestSeason` returns Tamil Nadu season strings.

Until that gap is closed, harvest date estimates are presented only where the
crop's own maturity data exists — an unrecognised variety shows no estimate
rather than one inherited from its plant type.

**`daysToHarvest` on a perennial means planting-to-first-crop.** Because
`calculateExpectedHarvestDate` takes the midpoint of the range for every type
except `fruit_tree`/`coconut_tree`, a perennial herb that stores its
season-length instead promises a first harvest years early. Black Pepper
carried the 180–270 day spike-to-ripe-berry window and was corrected on
6 September 2026 to 1095–1460 days, matching the Cardamom precedent
(900–1095). The season-length figure belongs in `growthStageDurations.fruiting`.
`yearsToFirstHarvest` is set alongside it, but is read only for fruit and
coconut trees, so on a herb it is display-only.

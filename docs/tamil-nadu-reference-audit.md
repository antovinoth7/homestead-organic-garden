# Tamil Nadu pest, disease, and organic-input audit

**Audit date:** 3 August 2026  
**Geographic scope:** Tamil Nadu, with the current risk calendar specifically tuned to the
Kanyakumari/high-rainfall zone.

## Executive result

The reference is a useful **first-response garden guide**, not an exhaustive crop-protection
manual. It currently contains 36 pest entries, 36 disease/disorder entries, and 12 organic
inputs. Application-label cross-checking against the 146 rows in the default plant catalog
finds at least one pest reference for 118 rows (80.8%) and at least one disease reference for
83 rows (56.8%). These figures are measured from `getPlantReferenceCoverage()`; the previously
recorded 145/114/87 had gone stale against the catalog. A broad label such as `Vegetables` counts
as coverage; therefore these figures measure discoverability, not proof that every listed treatment
is suitable for every cultivar.

The application audit is implemented in `referencePlantCoverage.ts`. It recognises deliberate
groups (`Vegetables`, `Fruit trees`, `Coconut`, `Flower crops`, and `Timber trees`), and separately
allows reviewed regional hosts that are not selectable catalog plants. Unknown labels now fail a
test rather than silently drifting away from the plant catalog.

## Corrections made

1. Panama wilt and Thanjavur wilt were moved from bacterial to fungal diseases. Their own causal
   organism fields identify *Fusarium oxysporum* f. sp. *cubense* and *Ganoderma lucidum*.
2. Citrus greening was moved from viral to bacterial; the entry identifies *Candidatus
   Liberibacter asiaticus*.
3. Coconut root wilt and brinjal little leaf were separated into a phytoplasma category instead
   of presenting phytoplasmas as bacteria or viruses.
4. Pongamia's Tamil label was corrected from `ஊமத்தை` (Datura) to `புங்க எண்ணெய்`.
5. Neem oil and 5% neem-seed-kernel extract are no longer presented as the same concentration.
   The guide now gives 3–5 mL/L for neem oil, distinguishes 5% kernel extract, removes the
   absolute “non-toxic” claim, and adds label, pollinator, scorch, and patch-test precautions.
6. Elemental sulphur no longer recommends a blanket 500 kg–2 t/ha range or blueberries for this
   Tamil Nadu catalog. Its soil application is explicitly conditional on a soil-test-calculated
   requirement.
7. Farmyard manure no longer lists poultry waste as a defining ingredient or treats four to six
   weeks as universal proof of maturity. Beejamrutha no longer tells users to soak every seed
   overnight.
8. Placeholder spinach rows such as `Hybrid Leafy`, `Local Green`, and the inappropriate
   frost-oriented `Winter Spinach` were replaced with actual warm-humid and Tamil leafy crops:
   Malabar spinach, water spinach, amaranth greens, ponnanganni, manathakkali, mustard greens,
   and vallarai. Palak remains, but is explicitly described as a short cool-season crop.
9. Turnip, knol khol, green peas, lablab bean, winged bean, sword bean, watermelon, and muskmelon
   were added with Tamil names, useful cultivars, and Kanyakumari season or drainage cautions.
10. Coconut choices now name Chowghat dwarf cultivars, West Coast and other tall cultivars, and
    the VHC 1–3 Tamil Nadu hybrids. King coconut remains available but is clearly identified as
    less standard locally than Tamil Nadu-released material.

## Important remaining gaps

### Plant coverage

The largest uncovered areas are herbs/spices, medicinal plants, ornamentals, and several fruit
trees. Examples include coriander, mint, curry leaf, tulsi, basil, black pepper, cardamom,
brahmi, ashwagandha, aloe vera, rose, marigold, pomegranate, jackfruit, arecanut, cocoa, and
nutmeg. These should be filled crop by crop; assigning a generic disease to all of them merely
to reach 100% would be unsafe.

High-priority Tamil Nadu additions for a later, source-backed content pass include:

- fall armyworm and maize stem borer;
- cucurbit fruit fly, pumpkin beetles, and downy mildew by host crop;
- onion thrips and purple blotch;
- turmeric/ginger shoot borer, rhizome scale, and soft rot;
- black pepper pollu beetle (*Longitarsus nigripennis*), top shoot borer, scale and root
  mealybug; quick wilt/foot rot (*Phytophthora capsici*), slow decline, and anthracnose;
- banana scarring beetle and burrowing nematode;
- arecanut spindle bug, fruit rot/mahali, and yellow leaf disease;
- groundnut leaf miner, tikka leaf spots, rust, and bud-necrosis disease;
- jasmine budworm/blossom midge and phyllody; and
- papaya damping-off/foot rot and powdery mildew.

These are a prioritisation list, **not yet application advice**. Each new record still needs a
current host, life-stage, season, formulation, legal-label, pre-harvest, and beneficial-organism
review.

### Organic inputs

The 12 inputs cover basic composts, fermented preparations, pH amendments, and two botanical
products, but they do not cover the major biological-control toolkit. Candidate additions are
neem cake, *Trichoderma* spp., *Pseudomonas fluorescens*, *Bacillus thuringiensis*, NPV products,
entomopathogenic fungi, phosphate-solubilising and nitrogen-fixing inoculants, green manures,
wood ash (with pH cautions), and crop-specific oil-cake guidance.

“Organic” must not be treated as synonymous with harmless. Product registration and label
directions, certification-standard acceptance, personal protection, re-entry/pre-harvest
intervals, pollinator timing, water-body protection, and patch testing remain product-specific.

## Black Pepper profile correction — 6 September 2026

This is a catalog-profile correction, not a treatment-reference change; no pest, disease, or
organic-input record was added. The `herb:Black Pepper` entry in
`plantCareDefaults/overrides/herbsSpices.ts` was checked field by field:

- `daysToHarvest` was the 180–270 day spike-to-ripe-berry window, but the field means
  planting-to-first-crop, so the app promised a first harvest ~225 days after planting. A vine
  bears from year 3 and stabilises around year 7; corrected to 1095–1460 days, with
  `yearsToFirstHarvest: 3` and `growthStageDurations` widened to match.
- `spacingCm` 200 → 270 (standards go in at 2.7 m × 2.7 m); `plantingDepthCm` 3 → 15 (vines are
  established from 2–3 node rooted cuttings with two nodes buried, not surface-sown).
- `soilType` `potting_mix` → `red_laterite`; `waterloggingTolerance: 'low'` added, since quick
  wilt follows water standing at the collar through the southwest monsoon.
- `wateringFrequencyDays` (2) and `feedingIntensity` (`medium`) were left alone: both are
  defensible for a young home-garden vine and both change generated task cadence, so they need
  their own review rather than a correction pass.
- Confirmed correct and unchanged: *Piper nigrum*/Piperaceae, `கருமிளகு`, `partial_sun`,
  pH 5.5–6.5, `droughtTolerance: 'low'`, 2–10 m height, `pruningFrequencyDays: 180`, and the
  Panniyur 1 / Karimunda cultivars.

Separately, the plant had no `PRUNING_INFO_BY_VARIETY` entry and inherited the generic herb
tips, including *“Remove flower buds to extend leaf growth”* — right only for a vine's first
two years, and crop-destroying advice on a bearing vine. It now carries pepper-specific
guidance: tying in runner shoots, removing ground-trailing runners, topping at the head of the
standard, the twice-yearly lopping the 180-day cadence tracks, and de-spiking qualified to
years 1–2.

**Still open:** black pepper remains absent from every pest and disease registry (see the
high-priority list above). Nothing in this pass changes that.

## Shrub category review — 6 September 2026

Prompted by a reference-image gap: five catalog rows had no bundled photo, and four of them were
shrubs. The cause was tooling, not staging — `getKnownPlantNames()` returned the keys of
`PLANT_EMOJI_MAP` (97 names) rather than the catalog (137), so a plant nobody gave an emoji got
neither a generated prompt nor a usable image slot. It now reads `PLANT_VARIETIES_BY_TYPE`, and
`referenceAssets.test.ts` fails if a catalog plant ever loses its reference-image name again.

Reviewing the shrub category against what a Kanyakumari homestead actually keeps found it stocked
almost entirely with ornamentals.

### Corrections

- **`shrub:Coleus` scientific name** was *Plectranthus amboinicus* — that is Karpooravalli /
  Omavalli, the thick-leaved kitchen medicinal, not the ornamental the row's own description
  ("shade-tolerant shrub used as living mulch") describes. Corrected to *Plectranthus
  scutellarioides*; Karpooravalli was added as its own entry.
- **Lantana** (*Lantana camara*) is a declared invasive weed in India and is actively cleared by
  the forest department; its foliage and unripe berries are toxic to livestock. The entry
  previously read as an unqualified recommendation ("thrives on neglect"). Kept — removing it
  would strand stored user profiles — but the catalog and care descriptions now say to contain it
  in a pot or clipped hedge, deadhead before the berries ripen, and keep it away from bunds and
  scrub.
- **Gardenia** wants acidic, humus-rich soil and shelter; it is not a Tamil Nadu open-ground
  hedge. Both descriptions now frame it as a sheltered container plant.
- **Ixora's Tamil name** differed between its two category rows — `இட்லிப்பூ` under `shrub`,
  `வெட்சி` under `flower`. Both now read `வெட்சி`. Hibiscus, Jasmine and Crossandra are also
  dual-listed and were checked; those three already agreed.

### Additions

Eight Tamil Nadu homestead shrubs, each with Tamil name, cultivars where they are meaningful, a
full care profile in `plantCareDefaults/overrides/tamilNaduShrubs.ts`, and pruning guidance:

| Name | Tamil | Species | Why it belongs |
| --- | --- | --- | --- |
| Adathodai | ஆடாதொடை | *Justicia adhatoda* | Cough medicinal; also cut as green-leaf manure |
| Nithyakalyani | நித்தியகல்யாணி | *Catharanthus roseus* | Year-round bloom on poor soil |
| Maruthani | மருதாணி | *Lawsonia inermis* | Henna; the standard boundary hedge |
| Aavaram | ஆவாரம் | *Senna auriculata* | Aavarampoo; nitrogen-fixing, holds bunds |
| Nochi | நொச்சி | *Vitex negundo* | Grain-storage and leaf-extract pest repellent |
| Thoothuvalai | தூதுவளை | *Solanum trilobatum* | Kitchen-doorway cough remedy |
| Arali | அரளி | *Nerium oleander* | Temple flower; `petToxicity: true`, sap and smoke warnings |
| Karpooravalli | கற்பூரவல்லி | *Plectranthus amboinicus* | Ubiquitous kitchen-door medicinal |

`daysToHarvest` on each is planting-to-first-usable-harvest, not season length — the distinction
the Black Pepper correction above turned on. Shrubs take the midpoint rule, so a season-length
figure here would promise a first cutting far too early.

Pruning was written per variety rather than left on the type-level default ("remove dead or weak
inner branches"), which is useless for a shrub cut for leaf and unsafe for Arali, whose sap
irritates skin and whose burning trimmings are toxic. This is the same failure mode as the generic
herb tip *"Remove flower buds to extend leaf growth"* on a bearing pepper vine.

Alias coverage was extended at the same time. **Betel Leaf had no aliases at all** — "Vetrilai"
existed only as a variety string, so a user typing the romanised name found nothing and was
offered a duplicate entry instead. Added `vetrilai`/`vettrilai`/`betel vine`/`paan`, the
Arecanut set (`pakku`, `betel nut`, `supari`), `sembaruthi`, `kanakambaram`, `malli`/`mullai`,
and romanised names for all eight new shrubs.

**Still open:** none of the eight has any pest or disease reference entry, and neither did the
three shrubs added in the earlier `newShrubs.ts` pass. Consistent with the position stated above,
no generic treatment was assigned to them to raise the coverage figure. *Costus igneus* (Insulin
Plant) is a herb-category candidate, not a shrub, and was deliberately left for a later pass.

## Category relevance pass — shrub, herb and flower — 6 September 2026

A follow-up to the section above, prompted by browsing the Shrub tab: it held plants that are not
shrubs, and plants with no Tamil Nadu connection. Two rules came out of it and now decide where a
plant is filed.

**Habit does not decide the category; use does.** `herb` already held Curry Leaf (described in
its own row as a "tree"), Black Pepper (a "vine"), Ashwagandha (a "shrub") and Brahmi (a
"creeper"). A plant harvested for its leaves is a herb whatever its woodiness, and `shrub` is
for woody perennials grown for the plant itself — hedges, boundaries and companions.

**A transliterated Tamil name is a reliable tell.** Where the "Tamil name" is only the English
word respelled — `கொல்லியஸ்` Coleus, `டேலியா` Dahlia, `ஆர்க்கிட்` Orchid, `ரோஸ்மேரி`
Rosemary, `தைம்` Thyme, `ஓரிகானோ` Oregano — nobody here calls the plant that, because it is
not grown here.

### Moved from shrub to herb

Adathodai, Nithyakalyani, Thoothuvalai and Karpooravalli. Karpooravalli (30–100 cm) is a succulent
herb and Thoothuvalai a scrambling climber; neither is a shrub on any reading. All four are
harvested for leaves or flowers. They had not shipped — they were added in the same uncommitted
change — so no migration was needed.

### Removed

| Plant | Category | Reason |
| --- | --- | --- |
| Lantana | shrub | A declared invasive weed in India, cleared by the forest department, toxic to livestock. The previous pass added a caution, but a caution on a "plant this" row is still a recommendation. |
| Gardenia | shrub | Exotic; wants acidic humus-rich soil and shelter. Its own profile (pH 5.0–6.0, "Mar–Sep") was already out of step with the rest of the catalog. |
| Coleus | shrub | Ornamental *Plectranthus scutellarioides*; exotic, 30–80 cm so not a shrub either. See the Koorka note below. |
| Parsley, Rosemary, Thyme, Oregano, Sage | herb | Mediterranean; none survives a Kanyakumari summer on the plains. |
| Dahlia, Orchid | flower | Hill-station and commercial-glasshouse crops, not homestead plants. |

**Basil and Dill were kept.** Both carry Tamil names in genuine use — `திருநீற்றுப்பச்சிலை` and
`சதகுப்பை`, and sathakuppai keerai is a Tamil Nadu crop — which is exactly what the five removed
herbs lack.

Removed plants keep their bundled reference photos, which move to
`EXTRA_REFERENCE_PLANT_NAMES` so the image map does not orphan them.

### De-duplication: Hibiscus, Ixora, Jasmine, Crossandra

Each existed as a row under **both** `flower` and `shrub`, with separate care profiles that had
already drifted — Ixora carried `வெட்சி` on one side and `இட்லிப்பூ` on the other. `flower`
wins: those rows came first, the reference images and alias targets already resolve there, and all
four are grown for their blooms.

These have shipped, so **migration 008** (`recategorise_shrub_flowers`, `LATEST_SCHEMA_VERSION`
7 → 8) re-types existing garden plants from `shrub` to `flower` and moves stored catalog
overrides across. It follows 007's shape but rewrites `plant_type` rather than `plant_variety`,
which 007 never did. Without it, `getPlantNamesForType` would promote each user's stored override
to a "user-added" plant and the duplicate row would survive under Shrub — the exact thing being
removed.

### Existing user plants of removed varieties are left alone

No data migration deletes them. `getPlantCareProfile` degrades to the category default and never
returns null for a valid type, so someone who planted Rosemary keeps the plant, its history and its
tasks; only the care cadence becomes generic. Deleting their records to tidy the catalog would be
the worse trade.

A related bug was fixed in passing: `getHiddenPlantNames` filtered only on `isDeleted`, so a
tombstone could outlive the catalog row it hid and the restore UI would offer to bring back a plant
that no longer exists — `restorePlantProfile` then removed the tombstone and produced nothing. It
now cross-checks the current defaults.

### Guards added

Nothing enforced that `PLANT_VARIETIES_BY_TYPE` — a second copy of the catalog's plant names, and
the one the whole care registry and the reference-image tooling actually read — agreed with
`DEFAULT_PLANT_CATALOG`. A comment added in the previous pass claimed `localSuitability` kept
them 1:1; it did not. Two tests now do:

- every catalog plant appears in `PLANT_VARIETIES_BY_TYPE` for the same category, and
- no `PLANT_CARE_OVERRIDES` key lacks a matching catalog row. An orphan key still lands in the
  registry through `Object.assign`, and `getPlantingCandidates()` enumerates every key — so a
  leftover would have the dashboard suggesting a plant the catalog no longer offers.

### Notes and still open

- ~~**Agathi stays in `shrub` despite being tree-scale**~~ — moved to `spinach` in the pass
  below. The worry that its `DYNAMIC_ACCUMULATORS` entry, `medicinal_guild` membership and two
  `rotationRules` advice strings would have to move with it was unfounded: all three match the
  plant by name, not by category, so none of them needed touching.
- **Koorka (Chinese potato, *Plectranthus rotundifolius*) is absent from the catalog** while
  Coleus carried the description "living mulch in coconut intercrop systems" — which describes
  Koorka, a real Tamil Nadu coconut intercrop, not an ornamental. Worth adding as a vegetable in a
  later pass.
- *Costus igneus* (Insulin Plant) remains a herb-category candidate, still deferred.
- None of the new medicinals has a pest or disease reference entry, unchanged from the section
  above.

## Vegetable category review — 6 September 2026

Prompted by two questions: what separates "Peas" from "Green Peas", and whether lettuce grows here.

### Peas and Green Peas were never two catalog rows

Only **Green Peas** is browsable (`vegetable`, பச்சைப் பட்டாணி, Arkel/Bonneville). "Peas" survived
only as the image filename — `PLANT_IMAGE_ALIASES` mapped `green_peas → peas` — plus leftover
keys from the May project scaffold. Nothing was duplicated in the plant list; one crop answered to
two names in two different layers.

That split was quietly costing something. `PLANT_EMOJI_MAP.Peas` (🫛), `COMPANION_PLANTS.Peas`
and `INCOMPATIBLE_PLANTS.Peas` were **dead code**: the browsable row is called "Green Peas" and
matched none of them, so it showed the generic 🌱 and offered no companion or antagonist advice.
The image is now `green_peas.webp`, the alias is gone, and the companion data is re-keyed onto the
name that exists.

Green Peas also had **no care profile at all**, so it resolved to bare vegetable defaults with no
species, season or harvest window — while item 9 above claims these crops were added "with
Kanyakumari season or drainage cautions". It now carries a *Pisum sativum* profile with the
Oct–Feb window and `heatTolerance: 'low'`.

### Removed as unsuited to Tamil Nadu

| Plant | Reason |
| --- | --- |
| Lettuce | `heatTolerance: 'low'`, germinates at 15–22 °C — unreachable here, where the coolest month sits near 25–27 °C. Bolts before it heads. |
| Strawberry | Same temperature profile, cultivar list reads `'Local Hill'`, and it is a fruit that was filed under vegetable. |
| Squash | *Cucurbita pepo* — climatically fine but not a Tamil homestead crop; named only by transliteration (ஸ்குவாஷ்). |
| Turnip | Cool-season and transliterated (டர்னிப்). **This reverses item 9 above**, which added it in August; the seasonal caution it shipped with is not enough to make it a homestead crop here. |

Both Lettuce and Strawberry are genuinely grown in Tamil Nadu — in the Nilgiris and Kodaikanal.
The catalog is scoped to the Kanyakumari/plains zone, so they do not belong in it.

Removing Turnip also removed its September–October sowing prompt from the Tamil Nadu planting
calendar, and Lettuce and Strawberry had to come out of the Leafy Greens guild template and the
leafy bed's recommended list. Ponnanganni Keerai took Lettuce's ground-cover slot in the guild.

### Two more one-crop-two-rows duplicates

The same fault as the shrub/flower pass, this time across `vegetable` ↔ `spinach`, with identical
cultivar lists on both sides:

| Crop | Kept | Dropped |
| --- | --- | --- |
| *Amaranthus tricolor* | **Amaranthus** (`vegetable`, அரைக்கீரை) | Amaranth Greens (`spinach`) |
| *Basella alba* | **Pasalai Keerai** (`vegetable`, பசளைக்கீரை) | Malabar Spinach (`spinach`, பசலை கீரை — the same name) |

The vegetable rows won because they carry the care profiles; the two spinach rows had none and fell
back to category defaults. The `keerai → amaranthus` alias already pointed at the vegetable row.
Both dropped names stay in `EXTRA_REFERENCE_PLANT_NAMES` so anyone who already planted one keeps
its photo.

### Purslane moved to spinach

பொட்டுக்கீரை is a keerai that sat in `vegetable` while every other keerai was in `spinach`. It
joins migration 008 (renamed `recategorise_plants`, since it now covers two category pairs rather
than shrub→flower alone).

### Pepper no longer shows a Chilli photo

`PLANT_IMAGE_ALIASES` mapped `pepper → chilli`, but Pepper is குடைமிளகாய் (capsicum) and Chilli is
மிளகாய் — different crops, and that map is only for names of the *same* crop. The alias is gone, so
Pepper now needs a bell-pepper photo of its own and appears in the missing-prompt list.

### Still open

- `PLANT_EMOJI_MAP` and `COMPANION_PLANTS` carry keys for plants that were never catalog rows —
  Broccoli, Spinach, Lily, Tulip, Coconut, Elephant Foot Yam — inherited from the May scaffold.
  They are harmless (both maps fall back) but dead. The keys this pass and the last one made dead
  were removed; these predate both and were left alone.
- Companion advice still names things outside the catalog (Roses, Ferns, "Most vegetables"). That
  is deliberate — advice may reference plants the app does not offer.
- **Koorka** (Chinese potato, *Plectranthus rotundifolius*) is still absent, as noted above.

## Keerai moved into a "Greens" category — 6 September 2026

The pass above resolved the Amaranthus/Amaranth Greens and Pasalai Keerai/Malabar Spinach
duplicates by keeping the `vegetable` rows, because those carried the care profiles. That fixed
the duplication but left two keerai filed as vegetables. Both now move to `spinach`, along with
**Fenugreek** — வெந்தயம் is vendhaya keerai, already an alias for it, though it stays a dual-purpose
crop grown for seed as well as leaf.

The category now holds nine rows of which only Palak is actually spinach (*Spinacia oleracea*), so
the tab is relabelled **Greens** in `plantLabels.ts`. That is display-only — the `PlantType` key
stays `spinach`, so nothing stored on a device or in Firestore changes.

Existing garden plants are re-typed by migration 008 (`recategorise_plants`), which now carries
eight names across two category pairs. It is still unreleased, so extending it was correct; had it
shipped, this would have needed a version 9, because `runPendingMigrations` short-circuits on a
cached `schema_version` at or above the latest.

### Two things that would have broken silently

- **`direct()` in `tamilNaduPlantingCalendar.ts` defaults `plantType` to `'vegetable'`.** The two
  Amaranthus rules and the Fenugreek rule relied on that default, so without an explicit
  `{ plantType: 'spinach' }` the Today screen would have kept emitting sow prompts for a
  `vegetable:Amaranthus` pair the catalog no longer has. Only the Palak rule had ever opted out.
- **`NAME_TYPE_ALIASES` in `plantTypeFromName.ts` hardcoded `amaranth: 'vegetable'`.** The Leafy
  Greens guild template row is literally named "Amaranth" (the catalog row is "Amaranthus"), so
  every bed-wizard plant created from that row would have been written with the wrong
  `plant_type` indefinitely.

Amaranthus also carries a second, partial override in `todayRecommendationCrops.ts`. Had only the
base key in `vegetables1.ts` been re-keyed, that correction would have been **silently discarded** —
it has too few fields to satisfy the create branch in `overrides/index.ts`, and there would have
been no key left to correct. Amaranthus would have quietly reverted to `daysToHarvest` 25–40 and
"Year Round" instead of the TNAU 25–30 and February–March / July–August. The orphan-override guard
does not catch this, because the discarded entry never becomes an orphan.

### An improvement that comes free

`TAMIL_NADU_COMMON_PESTS_DISEASES` and `PRUNING_INFO_BY_TYPE` are keyed by plant type, so all
three crops now inherit the greens lists instead of the fruiting-vegetable ones. They lose Fruit
Borer, Thrips, Mealybugs, Bacterial Wilt, Early Blight and Mosaic Virus and gain Flea Beetles,
Downy Mildew and Root Rot; the pruning tips change from "pinch tips to encourage branching" to
"harvest leaves regularly / pinch flowering tips to extend leaf harvest". Fruit borer on a leaf
crop was meaningless and downy mildew is the real amaranth problem, so this is the right list
arriving by the right route. Care cadence is unchanged — `getPlantCareProfile` returns a complete
override outright, so the `spinach` type defaults never apply to these three.

### Watermelon stays in `vegetable`

Asked whether Watermelon belongs under Fruit. Botanically yes, but `fruit_tree` is not a label —
the key carries tree semantics:

- `calculateExpectedHarvestDate` uses `yearsToFirstHarvest × 365` for `fruit_tree` and ignores
  `daysToHarvest`. Neither melon has `yearsToFirstHarvest`, so both would show **no harvest date**.
- `deriveInstanceLifecycle` forces `fruit_tree` → `'permanent'` regardless of the catalog
  lifecycle, so an 80-day annual melon would be recorded as a permanent planting that never
  completes and never clears its bed.

Pineapple and Passion Fruit sit in `fruit_tree` without being trees, but both are perennials
carrying `yearsToFirstHarvest`. The category means *perennial fruit crop*, not *tree*. Annual
cucurbits belong with Pumpkin and Ash Gourd, so Watermelon and Muskmelon stay put.

Both did, however, have **no care profile at all** — the same gap Green Peas had — and now carry
*Citrullus lanatus* and *Cucumis melo* profiles with a January–March window, sandy free-draining
soil and `waterloggingTolerance: 'low'`.

### Still open

- `fruit_tree` would need `calculateExpectedHarvestDate` and `deriveInstanceLifecycle` to respect
  an annual lifecycle before any annual fruit could live there. Not attempted; it changes behaviour
  for every fruit row.
- `transplant()` in the planting calendar does not accept a `plantType` option at all, so a
  transplanted non-vegetable would silently take the `'vegetable'` default. No current rule hits
  this, but the next one might.

## Tamil Nadu edible staples added — 14 September 2026

Prompted by browsing the Vegetable tab: Ivy Gourd (கோவைக்காய்) and Turkey Berry (சுண்டைக்காய்)
were both absent, and checking outward from those two found the same hole across the rest of what
a Kanyakumari homestead eats. The catalog carried Rambutan, Mangosteen and Avocado but not
Tamarind, and 46 vegetables without the perennial gourd that grows on half the pandals in the
district.

Eighteen plants were added. This pass is additive — nothing was removed and no existing row
changed category — apart from one Tamil-name correction the additions forced (below).

### Vegetables

| Name | Tamil | Species | Why it belongs |
| --- | --- | --- | --- |
| Ivy Gourd | கோவைக்காய் | *Coccinia grandis* | Perennial pandal vine; crops for years from a cutting |
| Turkey Berry | சுண்டைக்காய் | *Solanum torvum* | Sundakkai vathal; also the standard brinjal rootstock |
| Koorka | கூர்க்கன் கிழங்கு | *Plectranthus rotundifolius* | Coconut intercrop tuber — see below |
| Sesame | எள்ளு | *Sesamum indicum* | Gingelly oil and ellu urundai; joins the other field-crop rows |

**Koorka closes a gap this document opened twice.** The shrub review flagged it as "worth adding
as a vegetable in a later pass" after finding that `shrub:Coleus` carried the description "living
mulch in coconut intercrop systems" — which describes Koorka, not an ornamental *Plectranthus
scutellarioides*. The category relevance pass then repeated it under "Notes and still open", and
the vegetable review repeated it again. It is now in the catalog.

### Greens

| Name | Tamil | Species |
| --- | --- | --- |
| Pulicha Keerai | புளிச்சக்கீரை | *Hibiscus sabdariffa* |
| Karisalankanni Keerai | கரிசலாங்கண்ணி | *Eclipta prostrata* |
| Musumusukkai | முசுமுசுக்கை | *Mukia maderaspatana* |

Named **Pulicha Keerai**, not Gongura. Gongura is the Telugu name; every other row in the category
uses the Tamil `* Keerai` form, and the transliteration rule from the relevance pass cuts the same
way here. `gongura` is an alias.

### Spices and medicinals, filed under `herb`

| Name | Tamil | Species | Note |
| --- | --- | --- | --- |
| Pirandai | பிரண்டை | *Cissus quadrangularis* | Thuvaiyal and pickle climber |
| Clove | கிராம்பு | *Syzygium aromaticum* | Kanyakumari hill spice |
| Cinnamon | கருவாப்பட்டை | *Cinnamomum verum* | Coppiced for bark |
| Mango Ginger | மாஇஞ்சி | *Curcuma amada* | Grown exactly like Turmeric |

Clove and Cinnamon are trees, which does not decide the category — `herb` is the spice tab and
already holds Curry Leaf (a tree), Black Pepper (a vine) and Cardamom. Both follow the **Black
Pepper pattern**: `daysToHarvest` stated as planting-to-first-crop in days (2190–2920 for Clove,
1095–1460 for Cinnamon) with a matching `yearsToFirstHarvest`, so neither promises a first-season
harvest the way the uncorrected pepper profile did.

*Considered and rejected:* filing them in `fruit_tree` next to Nutmeg and Cocoa, which were added
as "coconut intercrop trees". `fruit_tree` forces `deriveInstanceLifecycle` → `permanent` and
ignores `daysToHarvest` entirely, and Cardamom is the closer precedent.

### Fruit trees

| Name | Tamil | Species | Note |
| --- | --- | --- | --- |
| Tamarind | புளி | *Tamarindus indica* | Grafted PKM 1 bears from year 4, seedling not before 8 |
| Naval | நாவல் | *Syzygium cumini* | Tolerates seasonally wet ground; planted on tank bunds |
| Cashew | முந்திரி | *Anacardium occidentale* | Major Kanyakumari crop on poor sandy ground |
| Wood Apple | விளாம்பழம் | *Limonia acidissima* | Spiny; slow |
| Ilanthai | இலந்தை | *Ziziphus mauritiana* | Fruits on current-season growth — wants a hard annual cutback |
| Palmyra | பனை | *Borassus flabellifer* | The state tree; nungu, padaneer, karupatti |
| Sweet Lime | சாத்துக்குடி | *Citrus limetta* | |

`fruit_tree` means *perennial fruit crop*, not literally a tree — the same reading that put
Pineapple and Passion Fruit there.

### Water Apple was carrying Jamun's Tamil name

`fruit_tree:Water Apple` gave its Tamil name as **நாவல்** in both the catalog and its care profile.
நாவல் is *Syzygium cumini* — Jamun. The row's own `scientificName` is *Syzygium aqueum*: a
different species in the same genus. Adding Naval would have put two different fruits under one
Tamil name, so the row now reads **ஜாம்பு**.

Correcting the bundled value is not enough on its own. `getProfileEntry` returns `stored ?? DEFAULT`
— a whole-entry replacement, never a field merge — and migration 003 wrote a full stored entry,
Tamil name included, for every plant belonging to any user who had a stored `plantCatalog`. The
corrected default would never have reached an existing install.

**Migration 011** (`repair_stale_tamil_names`, `LATEST_SCHEMA_VERSION` 10 → 11) repairs the stored
copy. It rewrites the field **only when the stored value still equals the stale bundled string**,
so a name the user set themselves is never clobbered — this repairs the app's mistake, not theirs.
Simpler than 008 and 010: a garden plant row records `plant_variety` and `plant_type`, never a
Tamil name, so there is no `plants`-collection pass. Keyed by plant name like `MERGED_PLANT_NAMES` and
`RECATEGORISED_PLANTS`, so the next such correction extends the map rather than adding a migration.

### Pruning was written per variety, again

Three of the eighteen resolved to the type-level defaults on the first pass, and one of them was
the failure this document already has a name for: **Mango Ginger inherited the generic herb tip
*"Remove flower buds to extend leaf growth"*** — the same wrong-by-default advice the Black Pepper
correction called out, this time on a crop grown for its rhizome. Koorka and Sesame were quietly
inheriting "remove yellowing lower leaves" too. All three now carry their own guidance, as do the
other fifteen.

The type defaults are wrong for most of this set in the same way: "thin crowded inner branches" is
meaningless on **Palmyra**, which has no branches and one growing point that does not regrow if
topped, and actively harmful on **Clove**, whose crop *is* the flower buds. **Ilanthai** needs the
opposite of the fruit-tree default — a hard annual cutback, because it fruits on the current
season's growth. **Pirandai** leads with a safety line: the raw sap irritates skin and mouth.

### Aliases

Romanised Tamil for all eighteen (`kovakkai`, `sundakkai`, `puli`, `nungu`, `jamun`, `mosambi`,
`kirambu`, `maa inji` and the rest), plus two **pre-existing** gaps found while checking: only the
bare `avarai` resolved to Lablab Bean, so `avarakkai`, `avaraikkai`, `mochai` and `mochakottai`
now do too. `Thandu Keerai` was added to the Amaranthus variety list.

Two rules in `plantAliases.test.ts` constrain this and caught a mistake during the pass: every
alias must resolve to a real catalog row, and no alias may itself be a catalog plant name — so
`pulicha keerai` is the row and `gongura` the alias, never the reverse.

### Reference images

Cashew ships with a photo at no bundle cost: `cashew_nut.webp` was already bundled under
`EXTRA_REFERENCE_PLANT_NAMES` from an earlier removal, and a `cashew → cashew_nut` entry in
`PLANT_IMAGE_ALIASES` points the new row at it. The other seventeen fall back to the themed
semantic icon, which `docs/REFERENCE_IMAGES.md` documents as safe and which twelve existing rows
already do. `npm run reference:manifest` now lists 29 missing prompts — the twelve that predate
this pass plus these seventeen. The bundled asset count is unchanged at 225.

### Considered and rejected

| Plant | Reason |
| --- | --- |
| Chow Chow (Chayote) | A Kodaikanal/Nilgiris hill crop. Same case as Lettuce and Strawberry, removed in the September relevance pass, and named here only by transliteration (ஸ்கௌ ஸ்கௌ). Widely *eaten* in Tamil Nadu; not grown on the plains. |
| Banana Stem | Vazhaithandu is a part of Banana, which is already a row — not a plant to select and grow. |
| Agathi Keerai | Agathi already exists and is what the keerai comes from — and the realignment pass that landed alongside this one moved it into `spinach` for exactly that reason. A second row would recreate the one-crop-two-rows duplication earlier passes spent two migrations undoing. |
| Sponge Gourd | *Luffa cylindrica*, a near-duplicate of the Ridge Gourd (*L. acutangula*) row that is the common Tamil Nadu crop. Not worth the ambiguity. |
| Kodukkapuli | *Pithecellobium dulce* — a wayside and fodder tree more than a homestead fruit. |

### Still open

- **None of the eighteen has a pest or disease reference entry.** Consistent with the position
  stated at the top of this document, no generic treatment was assigned to raise the coverage
  figure. Cashew (tea mosquito bug, stem and root borer), Tamarind and the two hill spices are the
  obvious candidates for a sourced content pass.
- **No planting-calendar rules were added.** Every rule in `tamilNaduPlantingCalendar.ts` is gated
  on a `TODAY_AGRONOMY_EVIDENCE` id with a `validUntil` and a TNAU citation, and
  `agronomyEvidenceDocs.test.ts` fails if the registry and this document drift apart. Sow windows
  for eighteen crops need a sourced review, not a guess.
- **`Yam` (கிழங்கு) remains a vague row** alongside `Elephant Yam` (கருணைக்கிழங்கு). கிழங்கு just
  means "tuber". Not touched here — it predates this pass and resolving it would mean deciding
  whether it is *Dioscorea* and, if it is a duplicate, another migration.

## Validation method and limitations

- Names were normalised case-insensitively and checked against the default catalog.
- Broad application groups are explicit and type-based; external hosts are kept in a reviewed
  allow-list.
- Causal-organism classifications were checked against the scientific names and causal text
  already stored in each entry, then aligned with standard plant-pathology groupings.
- Rates were made less prescriptive where soil test, formulation, crop label, or local product
  registration is required.
- Seasonal risk remains Kanyakumari-specific and must not be read as uniform for Tamil Nadu's
  other agro-climatic zones.
- Coverage percentages do not validate efficacy. Field diagnosis can confuse nutrient stress,
  pesticide injury, mites, viruses, phytoplasmas, and fungal/bacterial symptoms. Laboratory or
  local extension confirmation is appropriate for destructive action or persistent outbreaks.

## Primary references for the next content review

Use current crop-specific recommendations and registered product labels before expanding or
operationalising the guide:

- [Tamil Nadu Agricultural University Agritech crop-protection portal](https://agritech.tnau.ac.in/crop_protection/crop_prot.html)
- [Tamil Nadu Agricultural University Agritech organic-farming portal](https://agritech.tnau.ac.in/org_farm/orgfarm_index.html)
- [TNAU Crop Protection department](https://tnau.ac.in/site/cp/)
- [ICAR–National Research Centre for Banana](https://nrcb.icar.gov.in/)
- [ICAR–Central Plantation Crops Research Institute](https://cpcri.icar.gov.in/)
- [Coconut Development Board](https://coconutboard.gov.in/)
- [Central Insecticides Board and Registration Committee](https://ppqs.gov.in/divisions/cib-rc/about-cibrc)

Because recommendations and registrations change, source title, URL, access date, crop,
formulation, dose, and jurisdiction should be stored with every future treatment-level update.

## Today seasonal guidance audit — 16 August 2026

This audit is separate from the treatment reference above. It covers only the seasonal footer
assembled by `TodayScreen` and the catalog profiles linked from its crop tiles.

- All 38 saved Tamil Nadu districts resolve to one of the eight TNAU operational advisory zones.
  An unresolved district receives setup guidance; it never inherits Kanyakumari.
- The header uses IMD meteorological seasons. For 16 August 2026 it reports SW Monsoon, day 77
  of 122, week 11 of 18, with 45 days remaining.
- The planting registry uses only home-garden start windows stated in the reviewed TNAU material.
  August crops are Amaranthus (direct sow), Brinjal (transplant), Chilli (transplant), Cluster
  Beans (direct sow), and Radish (direct sow). Crop windows and pattam labels remain distinct
  from the meteorological season.
- Each rule stores its geographic scope, establishment action, conditions, evidence IDs, review
  date, and action-specific maturity. Rules are withheld after the evidence review expires.
- Linked Today crop profiles carry source scope and review information. User overrides are
  labelled user-supplied, and bundled images are labelled illustrative rather than diagnostic.
- Seasonal risk is non-diagnostic and requires a zone/season/active-host match. It is not an
  observed-pest alert and contains no treatment rate.

### Reviewed inputs

The table below mirrors `TODAY_AGRONOMY_EVIDENCE` in `src/config/tamilNaduPlantingCalendar.ts`,
which remains the source of truth: `validUntil` is what withholds expired guidance at runtime, so
the registry cannot be replaced by this document. The Today season card does not print these
citations — they are recorded here and shown in the app on the catalog plant detail screen, which
every Today crop tile opens. `src/__tests__/policy/agronomyEvidenceDocs.test.ts` fails if the two
drift apart.

All four are published by Tamil Nadu Agricultural University, accessed and reviewed on
2026-08-16, and valid until 2027-08-16.

| `id` | Title | URL | Published | Scope |
| --- | --- | --- | --- | --- |
| `tnau_zone_crop_planning` | Tamil Nadu agrometeorological advisory zone bulletin | <https://agritech.tnau.ac.in/agrometeorologicaladvisory/pdf/State%20comp%20AAS%20Bltn%20dtd.%2011.02.25.pdf> | 2025-02-11 | Tamil Nadu agrometeorological advisory zones |
| `tnau_home_garden` | Home and roof garden crop selection and raising | <https://agritech.tnau.ac.in/horticulture/horti_Landscaping_types%20of%20garden.html> | undated | Tamil Nadu home and roof gardens |
| `tnau_kitchen_garden` | Kitchen gardening | <https://agritech.tnau.ac.in/horticulture/horti_Landscaping_kitchengarden.html> | undated | Tamil Nadu kitchen gardens |
| `tnau_horticulture_guide` | Crop Production Guide — Horticulture | <https://www.agritech.tnau.ac.in/pdf/HORTICULTURE.pdf> | undated | Tamil Nadu horticultural crops |

The code records this as `source_reviewed`, not as an agronomist's approval. A Tamil Nadu
agronomist or TNAU/KVK-equivalent reviewer must still sign off before the content is represented
as expert-approved or guaranteed for production use.

## Applying the rule to the rows it was written for — 9 September 2026

The pass above stated the rule — *habit does not decide the category; use does* — and applied it
to the four plants it moved out of `shrub`. It did not apply it to the eight rows it left in, and
those rows break it. The catalog's own descriptions are the evidence:

| Row | What its description says it is grown for | Filed | Now |
| --- | --- | --- | --- |
| Nandiyavattai | "Fragrant white-flowered shrub sacred in Tamil temple gardens" | shrub | `flower` |
| Aavaram | "grown for its yellow aavarampoo flowers" | shrub | `flower` |
| Arali | "Temple flowering shrub… long-blooming" | shrub | `flower` |
| Maruthani | "leaves ground for henna" | shrub | `herb` |
| Nochi | "leaves… layered into stored grain and steeped as a leaf-extract pest spray" | shrub | `herb` |
| Agathi | "edible leaves and flowers" — this is agathi keerai | shrub | `spinach` |

Agathi goes to `spinach` rather than `herb` because every other edible-leaf crop is there and the
Herb tab is aromatics and medicinals — the same reasoning that put the four keerai there in the
`vegetable` → `spinach` pass.

That leaves `shrub` holding Bougainvillea and Castor: the two rows where nothing is harvested and
the plant itself is the point. The category is kept rather than retired — removing a `PlantType`
value is a breaking union change plus a migration for any user-added shrubs, which is not worth it
for two rows.

### Two duplicate rows had been dropped with no merge path

`Malabar Spinach` and `Pasalai Keerai` are both *Basella alba* — the surviving row's own
description says "Malabar spinach". `Amaranth Greens` and `Amaranthus` are likewise one plant.
The relevance pass dropped one of each without adding it to `MERGED_PLANT_NAMES` or
`PLANT_NAME_ALIASES`, so search for the dropped name returned nothing and a user whose garden
plant sat on it was stranded on a row that no longer existed — `plantTypeFromName` then defaulted
it to `vegetable`. Migration 007 had done exactly this job for Methi, Eggplant, Moringa and
Colocasia; the precedent simply was not applied.

### Migration 009 (`realign_catalog`, `LATEST_SCHEMA_VERSION` 8 → 9)

Renames garden plants off the two dropped names, then re-types the six moved rows, then applies
both plans to the stored catalog overrides and the AsyncStorage copy. Rename runs first: a plant
arriving as `Malabar Spinach` has to be `Pasalai Keerai` before anything reasons about its
category. Idempotent, like 007 and 008.

007's `MERGED_PLANT_NAMES` and 008's `RECATEGORISED_PLANTS` are frozen and 009 carries its own
maps in `catalogRealignmentLogic.ts`. An account already at schema v8 never runs those migrations
again, so anything appended to their maps would silently never reach it. The four planning
functions now take the map as an argument instead of closing over a module constant.

### Fixed in passing

- **`shrub:Nandiyavattai` was an orphaned care-override key** — the override lived in
  `timberCoconutShrubs.ts` while every other new shrub's lived in `tamilNaduPlants.ts`, so it was
  missed. `localSuitability`'s orphan check caught it. The only two `shrub:` override keys left
  are Bougainvillea and Castor, which is now a check in itself.
- **Agathi would have inherited the `spinach` pruning default**, whose third tip is "Pinch
  flowering tips to extend leaf harvest". Agathi poo is a harvest in its own right, so that advice
  costs the farmer a crop; Agathi and Nandiyavattai both got their own pruning entries.
- **`resolvePlantType` never consulted `PLANT_NAME_ALIASES`**, so "Agathi Keerai" and every other
  alias fell through to the `vegetable` default. It now falls back to the shared table after an
  exact catalog miss.
- **`BED_PLANT_CATALOG.leafy` recommended `Amaranth` and `Spinach`**, neither of which is a
  catalog row, so the leafy bed offered two crops the user could not then add. Now `Amaranthus`
  and `Palak`.
- **The tab order and the form order were two separate lists that had drifted** — `spinach` was
  eighth in `plantCatalog.ts` and third in `plantLabels.ts`, and the tabs read the eighth-place
  one, so Greens was the tab you scrolled furthest to reach. Both now read
  `src/utils/plantCategories.ts`, with Greens third.
- **`useUserCareProfiles` did not typecheck** — its state was typed `PlantCareProfiles` while
  `getPlantProfiles()` returns `PlantProfiles`. `npm run typecheck` was failing on the branch.

### Still open

- `malabar_spinach.webp` and `pasalai_keerai.webp` are now two bundled photos of one plant. Both
  names stay in `EXTRA_REFERENCE_PLANT_NAMES` so neither WebP is orphaned; collapsing them is a
  size-budget cleanup for a later pass (`docs/REFERENCE_IMAGES.md`).
- Black Pepper, Cardamom and Betel Leaf sit under Herb, and Arecanut, Cocoa and Nutmeg under
  Fruit. For a Kanyakumari farmer these are the plantation and intercrop block. A `spice`
  category was considered and rejected for now: it means a `PlantType` union change,
  `PlantProfiles`, labels, icons and a further migration. Aliases and row subtitles carry them
  instead.

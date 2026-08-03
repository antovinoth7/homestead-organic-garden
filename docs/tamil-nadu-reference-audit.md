# Tamil Nadu pest, disease, and organic-input audit

**Audit date:** 3 August 2026  
**Geographic scope:** Tamil Nadu, with the current risk calendar specifically tuned to the
Kanyakumari/high-rainfall zone.

## Executive result

The reference is a useful **first-response garden guide**, not an exhaustive crop-protection
manual. It currently contains 36 pest entries, 36 disease/disorder entries, and 12 organic
inputs. Application-label cross-checking against the 137 rows in the default plant catalog
finds at least one pest reference for 98 rows (71.5%) and at least one disease reference for
71 rows (51.8%). A broad label such as `Vegetables` counts as coverage; therefore these figures
measure discoverability, not proof that every listed treatment is suitable for every cultivar.

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

## Important remaining gaps

### Plant coverage

The largest uncovered areas are herbs/spices, medicinal plants, ornamentals, and several fruit
trees. Examples include coriander, mint, curry leaf, tulsi, basil, black pepper, cardamom,
brahmi, ashwagandha, aloe vera, rose, marigold, pomegranate, jackfruit, arecanut, cocoa, and
nutmeg. Catalog variety-like spinach rows also lack direct links. These should be filled crop by
crop; assigning a generic disease to all of them merely to reach 100% would be unsafe.

High-priority Tamil Nadu additions for a later, source-backed content pass include:

- fall armyworm and maize stem borer;
- cucurbit fruit fly, pumpkin beetles, and downy mildew by host crop;
- onion thrips and purple blotch;
- turmeric/ginger shoot borer, rhizome scale, and soft rot;
- pepper pollu beetle, quick wilt/foot rot, and slow decline;
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

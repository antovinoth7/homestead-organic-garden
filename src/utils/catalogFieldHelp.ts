/**
 * Help copy for every catalog field, surfaced through the ⓘ affordance on
 * each row.
 */
export const CATALOG_FIELD_HELP = {
  name: 'Catalog name shown in lists, details, and linked garden plants. Built-in plants keep their name so their pests, photo and care data stay linked — put the local name in Tamil name.',
  tamilName:
    'The name you use for this plant locally. It is shown next to the English name and is searchable, in Tamil script or English letters.',
  description:
    'Short plain-language summary of the plant. Keep it brief so it reads well in detail views.',
  scientificName:
    'Botanical Latin name used for accurate identification and future grouping logic.',
  taxonomicFamily:
    'Botanical family, such as Solanaceae (brinjal, tomato, chilli) or Fabaceae (beans, pulses). Reference only.',
  careModel:
    'Which care rules apply: growth stages, common pests, and how tasks repeat. It is separate from where the plant appears in the catalog, so a fruit that is not a tree can still be cared for as an annual. Set it now — it cannot be changed after saving.',
  lifecycle:
    'Defines whether the plant finishes its life cycle in one season, two seasons, or continues for multiple years.',
  growingSeason: 'Best sowing or growing window for Tamil Nadu and Kanyakumari conditions.',
  waterRequirement:
    'Overall water demand for this plant. Use it together with the watering interval below.',
  wateringFrequencyDays: 'How often watering reminders should repeat, in days.',
  fertilisingFrequencyDays:
    'How often fertiliser reminders should repeat, in days. Set Feeding Intensity above to auto-suggest this value.',
  sunlight: 'Amount of direct sun or shade the plant prefers in normal growing conditions.',
  soilType: 'Best-matching soil profile for drainage, root health, and nutrient performance.',
  preferredFertiliser: "Default fertiliser type suggested for this plant's care profile.",
  daysToHarvest:
    'Typical time from planting to first harvest. Use a range when timing varies by climate or variety.',
  yearsToFirstHarvest:
    'For trees and long-lived crops, how many years it usually takes to give the first useful harvest.',
  heightCm: 'Typical mature height range in centimeters.',
  spacingCm: 'Recommended distance between plants to reduce crowding and improve airflow.',
  plantingDepthCm: 'Suggested sowing or planting depth in centimeters.',
  germinationDays: 'How long seeds usually take to sprout under suitable conditions.',
  germinationTempC: 'Temperature range where germination is most reliable.',
  soilPhRange: 'Preferred soil acidity or alkalinity range for healthy growth.',
  heatTolerance: 'How well the plant handles sustained hot weather and heat stress.',
  droughtTolerance: 'How well the plant copes with dry spells or missed watering.',
  feedingIntensity:
    'How heavily the plant draws nutrients from the soil. Light: ~60 days between fertilising. Medium: ~30 days. Heavy: ~14 days. Selecting this auto-fills the fertilising interval below.',
  pruningFrequencyDays: 'How often pruning reminders should repeat, in days.',
  pruningTips: 'Short, practical pruning guidance. Add one tip per line.',
  shapePruningTip: 'How to prune for structure, airflow, and overall plant shape.',
  shapePruningMonths: 'Best months or season window for structural pruning.',
  flowerPruningTip: 'How to prune to support flowering and bloom quality.',
  flowerPruningMonths: 'Best months or season window for flower-focused pruning.',
  initialGrowthStage:
    'The stage a new garden plant starts at — seedling if you sow seed, vegetative if you plant a sapling.',
  petToxicity:
    'Whether this plant is known to be toxic to household pets such as dogs and cats. It does not cover livestock — check with a vet before letting cattle or goats graze near it.',
} as const;

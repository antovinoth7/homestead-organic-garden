/**
 * Help copy for every catalog field, surfaced through the ⓘ affordance on
 * each row.
 */
export const CATALOG_FIELD_HELP = {
  name: 'Primary catalog name shown in lists, details, and linked garden plants.',
  tamilName:
    'Tamil name stored with this catalog entry for localized views and future Tamil UI support.',
  description:
    'Short plain-language summary of the plant. Keep it brief so it reads well in detail views.',
  scientificName:
    'Botanical Latin name used for accurate identification and future grouping logic.',
  taxonomicFamily:
    'Plant family, such as Solanaceae or Fabaceae. Useful for related-crop and rotation features.',
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
    'Default stage assigned when a new garden plant is created from this catalog entry.',
  petToxicity:
    'Whether this plant is known to be toxic or safe for common household pets such as dogs and cats. Always confirm with a vet before allowing animals near the plant.',
} as const;

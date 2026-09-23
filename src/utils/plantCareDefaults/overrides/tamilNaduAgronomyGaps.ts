import { PlantCareProfile } from '@/types/database.types';
import { buildProfileKey } from '@/utils/plantCareDefaults/profileKey';

/**
 * Agronomy for the nine catalog plants that carried botanical identity only.
 *
 * `botanicalIdentity.ts` holds their binomial, family and lifecycle — facts —
 * and deliberately held nothing else, so these nine fell through to bare type
 * defaults. With no `daysToHarvest`, `buildCatalogMetaLine` fell back to the
 * lifecycle label and every one of them browsed as "Annual · Annual", telling
 * the grower nothing they could compare between rows.
 *
 * This file is the other half: regional *recommendations*, kept apart from the
 * facts rather than folded into them. The merge in `plantCareDefaults/index.ts`
 * layers `BOTANICAL_IDENTITY_OVERRIDES` on top of these, so identity still wins
 * its three fields and the agronomy underneath survives.
 *
 * `daysToHarvest` is planting-to-first-usable-harvest throughout, never season
 * length — the distinction the Black Pepper correction turned on. Each row names
 * the establishment action it is anchored to (sowing, cutting or slip), because
 * for the keerai the two differ by weeks. Figures are TNAU and Tamil Nadu
 * home-garden practice; they are NOT zone-parameterised and carry no evidence id
 * or review expiry, unlike `TAMIL_NADU_PLANTING_RULES` — none of these nine
 * appears there. See `docs/DOMAIN_LOGIC.md` → Regional scope.
 *
 * `tamilName` is deliberately absent. The catalog entry already carries it and
 * `buildDefaultProfiles` copies it onto the profile; migration 011 exists
 * because a second copy drifted from the first. Do not add one here.
 */

export const TAMIL_NADU_AGRONOMY_GAP_OVERRIDES: Record<string, PlantCareProfile> = {
  // ── vegetable ────────────────────────────────────────────────────────────
  // From sowing: transplanted at 25–30 DAS, the knob reaches an edible 5–7 cm
  // some 35–45 days later. Lifted whole, so it is a one-shot harvest.
  [buildProfileKey('vegetable', 'Knol Khol')]: {
    waterRequirement: 'medium',
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    description:
      'Swollen-stem brassica lifted whole while the knob is still tender. Grown through the mild months — a knob left past 7 cm turns woody and splits, so harvest on size rather than on the calendar.',
    daysToHarvest: { min: 60, max: 75 },
    heightCm: { min: 30, max: 45 },
    spacingCm: 20,
    plantingDepthCm: 1,
    growingSeason: 'NE Monsoon + Winter (Oct–Feb)',
    germinationDays: { min: 5, max: 10 },
    germinationTempC: { min: 18, max: 28 },
    soilPhRange: { min: 6.0, max: 7.5 },
    heatTolerance: 'medium',
    droughtTolerance: 'low',
    waterloggingTolerance: 'low',
    petToxicity: false,
    feedingIntensity: 'medium',
    growthStageDurations: { seedling: 25, vegetative: 35, mature: 15 },
  },
  // The three pandal legumes. All are sown, all carry over on a standing pandal,
  // and all spend their first weeks building frame before they flower — which is
  // why their harvest windows are long next to a bush bean's.
  //
  // From sowing: bush types give first green pods around 90 days, the local
  // pandal types Tamil homesteads actually grow run to 120.
  [buildProfileKey('vegetable', 'Lablab Bean')]: {
    waterRequirement: 'medium',
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 90,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    description:
      'Nitrogen-fixing pandal vine picked over for tender avarakkai pods across months. Carries over on a standing pandal rather than being resown each season; cut it back hard after a flush to bring on the next.',
    daysToHarvest: { min: 90, max: 120 },
    heightCm: { min: 200, max: 400 },
    spacingCm: 100,
    plantingDepthCm: 3,
    growingSeason: 'SW Monsoon (Jun–Sep)',
    germinationDays: { min: 5, max: 10 },
    germinationTempC: { min: 22, max: 32 },
    soilPhRange: { min: 6.0, max: 7.5 },
    heatTolerance: 'high',
    droughtTolerance: 'high',
    waterloggingTolerance: 'low',
    petToxicity: false,
    feedingIntensity: 'light',
    growthStageDurations: { seedling: 15, vegetative: 60, flowering: 25, fruiting: 25 },
  },
  // From sowing: photoperiod-sensitive, so it flowers on shortening days at
  // 65–90 days and the first tender pod follows about ten days behind.
  [buildProfileKey('vegetable', 'Winged Bean')]: {
    waterRequirement: 'medium',
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 90,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    description:
      'Four-ridged pod legume whose pods, leaves, flowers and tubers are all eaten. Flowering waits on shortening days, so a vine sown too early simply climbs — give it a tall pandal and let it take its time.',
    daysToHarvest: { min: 75, max: 100 },
    heightCm: { min: 200, max: 400 },
    spacingCm: 60,
    plantingDepthCm: 3,
    growingSeason: 'SW Monsoon (Jun–Sep)',
    germinationDays: { min: 7, max: 14 },
    germinationTempC: { min: 24, max: 32 },
    soilPhRange: { min: 5.5, max: 7.0 },
    heatTolerance: 'high',
    droughtTolerance: 'medium',
    waterloggingTolerance: 'medium',
    petToxicity: false,
    feedingIntensity: 'light',
    growthStageDurations: { seedling: 15, vegetative: 55, flowering: 20, fruiting: 15 },
  },
  // From sowing: the slowest of the three, a heavy vine that builds a large
  // frame before it flowers at all.
  [buildProfileKey('vegetable', 'Sword Bean')]: {
    waterRequirement: 'medium',
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 90,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    description:
      'Vigorous pandal legume grown for its broad sword-shaped pods, eaten young. Mature pods and seeds need thorough cooking; pick while the pod still snaps and the seed is barely formed.',
    daysToHarvest: { min: 100, max: 130 },
    heightCm: { min: 200, max: 500 },
    spacingCm: 100,
    plantingDepthCm: 4,
    growingSeason: 'SW Monsoon (Jun–Sep)',
    germinationDays: { min: 7, max: 14 },
    germinationTempC: { min: 24, max: 34 },
    soilPhRange: { min: 5.5, max: 7.5 },
    heatTolerance: 'high',
    droughtTolerance: 'high',
    waterloggingTolerance: 'low',
    petToxicity: false,
    feedingIntensity: 'light',
    growthStageDurations: { seedling: 18, vegetative: 65, flowering: 25, fruiting: 25 },
  },

  // ── spinach (Greens) ─────────────────────────────────────────────────────
  // The three cutting- and slip-grown perennial greens use the Ivy Gourd shape:
  // `germinationDays` is 0 and the plant starts at `vegetative`, because nothing
  // is sown. All three are cut repeatedly rather than lifted, so
  // `pruningFrequencyDays` is the ratoon interval, not a shaping cut.
  //
  // From a cutting (or from seed, which runs the same): first cut at 30–40 days,
  // then ratooned every 20–25.
  [buildProfileKey('spinach', 'Water Spinach')]: {
    waterRequirement: 'high',
    wateringFrequencyDays: 1,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 25,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'vegetative',
    description:
      'Fast tropical green for a permanently wet bed or a shallow trench, cut and cut again. It roots from every node and escapes readily — keep it out of channels and waterways, and cut rather than let it run.',
    daysToHarvest: { min: 30, max: 45 },
    heightCm: { min: 30, max: 60 },
    spacingCm: 20,
    plantingDepthCm: 5,
    growingSeason: 'Year Round',
    germinationDays: { min: 0, max: 0 },
    germinationTempC: { min: 24, max: 34 },
    soilPhRange: { min: 5.5, max: 7.5 },
    heatTolerance: 'high',
    droughtTolerance: 'low',
    waterloggingTolerance: 'high',
    petToxicity: false,
    feedingIntensity: 'medium',
    growthStageDurations: { vegetative: 30 },
  },
  // From stem cuttings: roots as it runs, first cut around 30 days, then
  // cut-and-come-again off the same mat.
  [buildProfileKey('spinach', 'Ponnanganni Keerai')]: {
    waterRequirement: 'high',
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 30,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'vegetative',
    description:
      'Low creeping keerai that mats across a damp bed and is cut over for months. Planted from stem pieces pushed into moist soil; cut above the crown so the mat regrows rather than uprooting it.',
    daysToHarvest: { min: 30, max: 40 },
    heightCm: { min: 15, max: 40 },
    spacingCm: 20,
    plantingDepthCm: 3,
    growingSeason: 'Year Round',
    germinationDays: { min: 0, max: 0 },
    germinationTempC: { min: 22, max: 32 },
    soilPhRange: { min: 5.5, max: 7.5 },
    heatTolerance: 'high',
    droughtTolerance: 'low',
    waterloggingTolerance: 'high',
    petToxicity: false,
    feedingIntensity: 'light',
    growthStageDurations: { vegetative: 30 },
  },
  // From slips: the slow establisher of the three. TNAU medicinal-crop practice
  // takes the first cut at about 90 days, then every 45–60.
  [buildProfileKey('spinach', 'Vallarai Keerai')]: {
    waterRequirement: 'high',
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 60,
    sunlight: 'partial_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'vegetative',
    description:
      'Creeping medicinal green for a shaded, permanently moist corner, valued for its rounded leaves. Slow to cover ground in its first season; once established it runs from the nodes and is cut every couple of months.',
    daysToHarvest: { min: 60, max: 90 },
    heightCm: { min: 10, max: 25 },
    spacingCm: 25,
    plantingDepthCm: 3,
    growingSeason: 'Year Round',
    germinationDays: { min: 0, max: 0 },
    germinationTempC: { min: 22, max: 30 },
    soilPhRange: { min: 5.5, max: 7.0 },
    heatTolerance: 'medium',
    droughtTolerance: 'low',
    waterloggingTolerance: 'high',
    petToxicity: false,
    feedingIntensity: 'light',
    growthStageDurations: { vegetative: 60 },
  },
  // From sowing, for the LEAF crop. The berries are a different harvest at
  // 70–90 days, and the unripe ones are not eaten — hence `petToxicity`.
  [buildProfileKey('spinach', 'Manathakkali Keerai')]: {
    waterRequirement: 'medium',
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    description:
      'Short-lived Tamil green cooked for its leaves, with ripe berries dried for vathal. A solanaceae, so it follows Brinjal and Tomato in the same rotation family; the unripe berries and raw leaves are not eaten.',
    daysToHarvest: { min: 30, max: 45 },
    heightCm: { min: 30, max: 80 },
    spacingCm: 25,
    plantingDepthCm: 1,
    growingSeason: 'Year Round',
    germinationDays: { min: 6, max: 12 },
    germinationTempC: { min: 22, max: 32 },
    soilPhRange: { min: 6.0, max: 7.5 },
    heatTolerance: 'high',
    droughtTolerance: 'medium',
    waterloggingTolerance: 'low',
    petToxicity: true,
    feedingIntensity: 'light',
    growthStageDurations: { seedling: 12, vegetative: 25, flowering: 20 },
  },
  // From sowing: the fastest of the nine — tender leaves pulled at 25–30 days
  // in the mild months, before the plant runs to flower in the heat.
  [buildProfileKey('spinach', 'Mustard Greens')]: {
    waterRequirement: 'medium',
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',
    description:
      'Peppery brassica green for the mild, less humid months, sown thickly and thinned into the pot. Bolts quickly once the heat arrives, so sow small batches in succession rather than one large bed.',
    daysToHarvest: { min: 25, max: 40 },
    heightCm: { min: 30, max: 60 },
    spacingCm: 20,
    plantingDepthCm: 1,
    growingSeason: 'NE Monsoon + Winter (Oct–Feb)',
    germinationDays: { min: 4, max: 8 },
    germinationTempC: { min: 18, max: 28 },
    soilPhRange: { min: 6.0, max: 7.5 },
    heatTolerance: 'medium',
    droughtTolerance: 'medium',
    waterloggingTolerance: 'low',
    petToxicity: false,
    feedingIntensity: 'medium',
    growthStageDurations: { seedling: 10, vegetative: 20 },
  },
};

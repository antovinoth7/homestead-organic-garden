export type SpaceType = 'pot' | 'bed' | 'ground';

// ─── Farm Setup Types (Phase B3) ─────────────────────────────────────────────

export type FarmGoal = 'self_sufficiency' | 'surplus_sale' | 'seed_saving' | 'medicinal' | 'fodder';

export interface FarmConfig {
  /** @deprecated moved to LocationProfile.land_cents per-plot */
  land_cents?: number;
  /** @deprecated tracked individually as plant_type: "coconut_tree" */
  coconut_tree_count?: number;
  families_count: number;
  goals: FarmGoal[];
  updated_at?: string;
}

// ─── Bed Management Types (Phase B2) ─────────────────────────────────────────

export type BedType =
  | 'leafy'
  | 'fruiting'
  | 'spice'
  | 'root_legume'
  | 'climber_trellis'
  | 'coconut_intercrop'
  | 'three_sisters'
  | 'medicinal_guild';

export type CropFamily =
  | 'solanaceae'
  | 'cucurbit'
  | 'legume'
  | 'brassica'
  | 'allium'
  | 'apiaceae'
  | 'lamiaceae'
  | 'flower'
  | 'other';

export type BedSlope = 'flat' | 'gentle' | 'moderate' | 'steep';

export type IrrigationMethod = 'drip' | 'sprinkler' | 'flood' | 'hand_watering' | 'none';

export type BedTaskSubtype =
  | 'water_bed'
  | 'jeevamrutha'
  | 'weeding'
  | 'mulch'
  | 'wood_ash'
  | 'chop_and_drop';

export type BedLayer = 'canopy' | 'understory' | 'ground_cover' | 'root' | 'climber';
export type TaskType =
  | 'water'
  | 'fertilise'
  | 'prune'
  | 'repot'
  | 'spray'
  | 'mulch'
  | 'harvest'
  | 'harvest_leaves';
export type PlantType =
  | 'vegetable'
  | 'herb'
  | 'flower'
  | 'fruit_tree'
  | 'timber_tree'
  | 'coconut_tree'
  | 'shrub'
  | 'spinach';
export enum JournalEntryType {
  Observation = 'observation',
  Harvest = 'harvest',
  Issue = 'issue',
  Milestone = 'milestone',
  Other = 'other',
}
export type SunlightLevel = 'full_sun' | 'partial_sun' | 'shade';
export type SoilType =
  | 'garden_soil'
  | 'potting_mix'
  | 'coco_peat'
  | 'red_laterite'
  | 'laterite'
  | 'coastal_sandy'
  | 'black_cotton'
  | 'alluvial'
  | 'red_loam'
  | 'clay_loam'
  | 'sandy_loam'
  | 'custom';
export type WaterRequirement = 'low' | 'medium' | 'high';
export type HealthStatus = 'healthy' | 'stressed' | 'recovering' | 'sick';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'severe';
export type FertiliserType =
  | 'compost'
  | 'vermicompost'
  | 'cow_dung_slurry'
  | 'fish_emulsion'
  | 'groundnut_cake'
  | 'seaweed'
  | 'neem_cake'
  | 'panchagavya'
  | 'jeevamrutham'
  | 'other';
export type GrowthStage =
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'dormant'
  | 'mature';

export type PlantLifecycle = 'annual' | 'biennial' | 'perennial' | 'permanent';
export type HarvestMode = 'cut_and_come_again' | 'one_shot';
export type ToleranceLevel = 'low' | 'medium' | 'high';
export type FeedingIntensity = 'light' | 'medium' | 'heavy';

// Growth stage auto-progression (Phase B.4)
export type GrowthStageDurations = Partial<Record<GrowthStage, number>>;
export type AnnualCycleDurations = Partial<Record<GrowthStage, number>>;
export interface GrowthStageHistoryEntry {
  stage: GrowthStage;
  pinnedAt: string;
  unpinnedAt?: string | null;
}

export interface NumericRange {
  min: number;
  max: number;
}

export type DrainageQuality = 'poor' | 'fair' | 'good' | 'excellent';
export type MoistureRetention = 'low' | 'medium' | 'high';
export type NutrientLevel = 'low' | 'medium' | 'high';
export type WindExposure = 'sheltered' | 'moderate' | 'exposed';
export type WaterSource = 'rain_fed' | 'borewell' | 'tap' | 'pond_canal' | 'drip' | 'mixed';

export interface BedPosition {
  x: number; // 0–1 normalized (fraction of bed width)
  y: number; // 0–1 normalized (fraction of bed length)
}

/**
 * How a wizard PlantEntry should be turned into a real Plant record on bed save.
 *  - placeholder: create a generic Plant with no variety (default when omitted)
 *  - link: attach an existing user Plant to the new bed
 *  - create: create a new Plant, optionally with a chosen variety
 */
export type EntryResolution =
  | { kind: 'placeholder' }
  | { kind: 'link'; plantId: string }
  | { kind: 'create'; variety?: string };

/** A single plant instance placed in a bed (wizard state only — not persisted). */
export interface PlantEntry {
  id: string; // unique per planting instance (allows same species multiple times)
  name: string; // plant species name
  layer: BedLayer;
  spacingCm: number;
  resolution?: EntryResolution; // omitted = { kind: 'placeholder' }
  sortOrder?: number; // per-layer display order, lower = first. Missing → treat as 0
}

export interface BedDimensions {
  width_m: number;
  length_m: number;
  area_sqm: number;
}

export interface PestHistoryItem {
  pest_name: string;
  severity: IssueSeverity;
  season: string;
  year: number;
}

/**
 * Per-row snapshot of an active bed planting. Persisted on `Bed.row_layout` so
 * future seasons can warn against same-family back-to-back at the row level
 * (more granular than the bed-wide `prev_crop_family`).
 */
export interface BedRowSnapshot {
  row_index: number;
  layer: BedLayer;
  north_edge_cm: number;
  plants_per_row: number;
  crop_families: CropFamily[];
  species: string[];
  planted_at: string;
}

/** Append-only history entry: a `BedRowSnapshot` that has been cleared/uprooted. */
export interface BedRowHistoryEntry extends BedRowSnapshot {
  cleared_at?: string;
}

export interface Bed {
  id: string;
  user_id: string;
  name: string;
  type: BedType;
  dimensions: BedDimensions;
  sunlight: SunlightLevel;
  soil_type: SoilType;
  slope: BedSlope;
  wind: WindExposure;
  prev_land_use?: string | null;
  prev_crop_family?: CropFamily | null;
  prev_crop_season?: string | null;
  pest_history: PestHistoryItem[];
  water_source?: WaterSource | null;
  irrigation_method?: IrrigationMethod | null;
  parent_location?: string | null;
  child_location?: string | null;
  is_raised_bed: boolean;
  is_permanent: boolean;
  coconut_distance_m?: number | null;
  is_resting?: boolean;
  resting_until?: string | null;
  last_water_date?: string | null;
  last_jeevamrutha_date?: string | null;
  last_weeding_date?: string | null;
  notes?: string | null;
  row_layout?: BedRowSnapshot[];
  row_history?: BedRowHistoryEntry[];
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface RotationRule {
  id: string;
  rule: string;
  passed: boolean;
  description: string;
}

export interface HarvestGapWarning {
  bed_id: string;
  category: BedType;
  gap_start: string;
  gap_end: string;
}

export interface GreenManureRecommendation {
  name: string;
  tamilName?: string;
  sow_month: number;
  rationale: string;
}

export interface RotationStatus {
  bed_id: string;
  has_solanaceae_violation: boolean;
  legume_coverage_pct: number;
  harvest_gap_warnings: HarvestGapWarning[];
  coordinator_checklist: RotationRule[];
  green_manure_recommendation?: GreenManureRecommendation | null;
}

export interface LocationProfile {
  soilPH?: number | null;
  soilType?: SoilType | null;
  drainageQuality?: DrainageQuality | null;
  moistureRetention?: MoistureRetention | null;
  nitrogenLevel?: NutrientLevel | null;
  phosphorusLevel?: NutrientLevel | null;
  potassiumLevel?: NutrientLevel | null;
  windExposure?: WindExposure | null;
  waterSource?: WaterSource | null;
  lastSoilTestDate?: string | null;
  notes?: string | null;
  /** Plot size in cents (1 cent = 40.47 sqm). Stored per location since each plot can differ. */
  land_cents?: number | null;
  /** Decimal latitude for this plot. User-entered manually from Google Maps. */
  latitude?: number | null;
  /** Decimal longitude for this plot. User-entered manually from Google Maps. */
  longitude?: number | null;
}

export interface LocationConfig {
  parentLocations: string[];
  childLocations: string[];
  /** Short names (3–5 chars) keyed by parent location name, used in auto-generated plant names. */
  parentLocationShortNames?: Record<string, string>;
  /** Soil & environment profile keyed by parent location name. */
  parentLocationProfiles?: Record<string, LocationProfile>;
}

export interface VarietyDetail {
  daysToMaturity?: number;
  /** Values are strings from GROWING_SEASON_OPTIONS in plantLabels.ts */
  seasonSuitability?: string[];
  seedSource?: string;
  notes?: string;
}

/** @deprecated Use PlantProfile */
export interface PlantCatalogCategory {
  plants: string[];
  varieties: Record<string, string[]>;
  /** Tamil names keyed by English plant name. Data-only until Phase G language toggle. */
  tamilNames?: Record<string, string>;
  /** One-line English descriptions keyed by plant name. */
  descriptions?: Record<string, string>;
  /** Optional metadata keyed by plantName → varietyName → detail. */
  varietyDetails?: Record<string, Record<string, VarietyDetail>>;
}

/** @deprecated Use PlantProfiles */
export interface PlantCatalog {
  categories: Record<PlantType, PlantCatalogCategory>;
}

export interface PlantCareProfile {
  waterRequirement: WaterRequirement;
  wateringFrequencyDays?: number;
  wateringEnabled?: boolean;
  fertilisingFrequencyDays?: number;
  fertilisingEnabled?: boolean;
  pruningFrequencyDays?: number;
  pruningEnabled?: boolean;
  sunlight: SunlightLevel;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;
  initialGrowthStage: GrowthStage;
  pruningTips?: string[];
  shapePruningTip?: string;
  shapePruningMonths?: string;
  flowerPruningTip?: string;
  flowerPruningMonths?: string;
  // Botanical identity (Phase A2)
  scientificName?: string;
  taxonomicFamily?: string;
  lifecycle?: PlantLifecycle;
  tamilName?: string;
  description?: string;
  // Growing parameters (Phase A2)
  daysToHarvest?: NumericRange;
  yearsToFirstHarvest?: number;
  heightCm?: NumericRange;
  spacingCm?: number;
  plantingDepthCm?: number;
  growingSeason?: string;
  germinationDays?: NumericRange;
  germinationTempC?: NumericRange;
  soilPhRange?: NumericRange;
  // Tolerances (Phase A2)
  heatTolerance?: ToleranceLevel;
  droughtTolerance?: ToleranceLevel;
  waterloggingTolerance?: ToleranceLevel;
  // Safety (Phase A2)
  petToxicity?: boolean;
  feedingIntensity?: FeedingIntensity;
  // User-extendable lists (Phase A3 UI)
  customPests?: string[];
  customDiseases?: string[];
  customBeneficials?: string[];
  // Growth stage auto-progression (Phase B.4)
  growthStageDurations?: GrowthStageDurations;
  annualCycleDurations?: AnnualCycleDurations;
  floweringStartMonth?: number;
  // User catalog fields (Phase B2.15)
  seedSource?: string;
  isPermanent?: boolean;
  isDynamicAccumulator?: boolean;
  chopDropIntervalDays?: number;
  guild?: string;
  vitamins?: string[];
  minerals?: string[];
}

/** @deprecated Use PlantProfile */
export type PlantCareProfileOverride = Partial<PlantCareProfile>;

/** @deprecated Use PlantProfiles */
export type PlantCareProfiles = Record<PlantType, Record<string, PlantCareProfileOverride>>;

// ─── Unified Plant Profile (replaces PlantCatalog + PlantCareProfiles) ─────────

/** Single source of truth for a plant entry: catalog metadata + care override fields. */
export interface PlantProfile {
  plantType: PlantType;
  name: string;
  // Catalog metadata
  tamilName?: string;
  description?: string;
  varieties?: string[];
  varietyDetails?: Record<string, VarietyDetail>;
  isUserAdded?: boolean;
  // Care override fields (all optional — fall back to static defaults)
  waterRequirement?: WaterRequirement;
  wateringFrequencyDays?: number;
  wateringEnabled?: boolean;
  fertilisingFrequencyDays?: number;
  fertilisingEnabled?: boolean;
  pruningFrequencyDays?: number;
  pruningEnabled?: boolean;
  sunlight?: SunlightLevel;
  soilType?: SoilType;
  preferredFertiliser?: FertiliserType;
  initialGrowthStage?: GrowthStage;
  pruningTips?: string[];
  shapePruningTip?: string;
  shapePruningMonths?: string;
  flowerPruningTip?: string;
  flowerPruningMonths?: string;
  scientificName?: string;
  taxonomicFamily?: string;
  lifecycle?: PlantLifecycle;
  daysToHarvest?: NumericRange;
  yearsToFirstHarvest?: number;
  heightCm?: NumericRange;
  spacingCm?: number;
  plantingDepthCm?: number;
  growingSeason?: string;
  germinationDays?: NumericRange;
  germinationTempC?: NumericRange;
  soilPhRange?: NumericRange;
  heatTolerance?: ToleranceLevel;
  droughtTolerance?: ToleranceLevel;
  waterloggingTolerance?: ToleranceLevel;
  petToxicity?: boolean;
  feedingIntensity?: FeedingIntensity;
  customPests?: string[];
  customDiseases?: string[];
  customBeneficials?: string[];
  growthStageDurations?: GrowthStageDurations;
  annualCycleDurations?: AnnualCycleDurations;
  floweringStartMonth?: number;
  seedSource?: string;
  isPermanent?: boolean;
  isDynamicAccumulator?: boolean;
  chopDropIntervalDays?: number;
  guild?: string;
  cropFamily?: CropFamily;
  layer?: BedLayer;
  vitamins?: string[];
  minerals?: string[];
}

/** Top-level unified store: PlantType → plant name → PlantProfile. */
export type PlantProfiles = Record<PlantType, Record<string, PlantProfile>>;

export interface PestDiseaseRecord {
  id?: string;
  type: 'pest' | 'disease';
  name: string;
  occurredAt: string;
  severity?: IssueSeverity;
  affectedPart?: string;
  treatment?: string;
  treatmentEffectiveness?: 'effective' | 'partially_effective' | 'ineffective';
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
  photo_filename?: string;
}

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  plant_type: PlantType;
  plant_variety?: string | null;
  // Stable filename stored in Firestore/backups
  photo_filename?: string | null;
  // Local file URI derived from filename (not stored in Firestore)
  photo_url: string | null;
  space_type: SpaceType;
  location: string;
  landmarks?: string | null;
  bed_name?: string | null;
  pot_size?: string | null;
  notes?: string | null;
  // Environment & Care
  sunlight?: SunlightLevel | null;
  soil_type?: SoilType | null;
  water_requirement?: WaterRequirement | null;
  watering_frequency_days?: number | null;
  fertilising_frequency_days?: number | null;
  preferred_fertiliser?: FertiliserType | null;
  mulching_used?: boolean | null;
  // Plant-specific fields
  planting_date?: string | null;
  harvest_season?: string | null;
  mature_height?: string | null;
  variety?: string | null;
  // Harvest tracking
  harvest_start_date?: string | null;
  harvest_end_date?: string | null;
  last_harvest_date?: string | null;
  // Health & Tracking
  last_watered_date?: string | null;
  last_fertilised_date?: string | null;
  health_status?: HealthStatus | null;
  // Pest & Disease History
  pest_disease_history?: PestDiseaseRecord[] | null;
  // Expected Harvest Date
  expected_harvest_date?: string | null;
  // PHASE 1: Growth Stage & Pruning
  growth_stage?: GrowthStage | null;
  growth_stage_pinned?: GrowthStage | null;
  growth_stage_history?: GrowthStageHistoryEntry[] | null;
  pruning_frequency_days?: number | null;
  last_pruned_date?: string | null;
  pruning_notes?: string | null;
  // Coconut-specific tracking (Kanyakumari)
  coconut_fronds_count?: number | null; // healthy range: 30-35
  nuts_per_month?: number | null; // nuts collected at last harvest
  last_climbing_date?: string | null; // last harvest via climbing
  spathe_count_per_month?: number | null; // inflorescence count (yield predictor for bearing trees)
  nut_fall_count?: number | null; // premature nut drop count at last incident
  last_nut_fall_date?: string | null; // date of last premature nut fall incident
  // Soft delete
  is_deleted?: boolean | null;
  deleted_at?: string | null;
  // Care task enable/disable toggles (Phase B)
  watering_enabled?: boolean | null;
  fertilising_enabled?: boolean | null;
  pruning_enabled?: boolean | null;
  // Bed association (Phase B2)
  bed_id?: string | null;
  bed_layer?: BedLayer | null;
  sow_date?: string | null;
  crop_family?: CropFamily | null;
  spacing_cm?: number | null;
  sort_order?: number | null; // per-bed-layer display order; null for plants not in a bed
  position_in_bed?: BedPosition | null;
  light_requirement?: SunlightLevel | null;
  season_suitability?: string[] | null;
  // Recurring Care Schedule (for auto-generating tasks)
  care_schedule?: {
    water_frequency_days?: number;
    fertilise_frequency_days?: number;
    prune_frequency_days?: number;
    auto_generate_tasks?: boolean;
  } | null;
  // Lifecycle classification (Phase L)
  lifecycle_type?: PlantLifecycle | null;
  harvest_mode?: HarvestMode | null;
  cleared_date?: string | null;
  archived_at?: string | null;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  user_id: string;
  plant_id: string | null;
  task_type: TaskType;
  frequency_days: number;
  preferred_time: string | null;
  enabled: boolean;
  next_due_at: string;
  priority_level?: 'critical' | 'high' | 'medium' | 'low' | null;
  // Bed association (Phase B2)
  bed_id?: string | null;
  task_subtype?: BedTaskSubtype | null;
  created_at: string;
}

export interface TaskLog {
  id: string;
  user_id: string;
  template_id: string;
  plant_id: string | null;
  task_type: TaskType;
  done_at: string;
  product_used?: string | null;
  notes?: string | null;
  harvest_weight_kg?: number | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  plant_id: string | null;
  entry_type: JournalEntryType;
  content: string;
  // Stable filenames stored in Firestore/backups
  photo_filenames?: string[];
  // Local file URIs derived from filenames
  photo_urls: string[];
  // Legacy field for backward compatibility
  photo_url?: string | null;
  // Structured tags for filtering journal entries
  tags?: string[];
  // Enhanced Harvest tracking fields
  harvest_quantity?: number | null;
  harvest_unit?: string | null; // 'kg', 'g', 'lbs', 'pieces', 'bunches'
  harvest_quality?: 'excellent' | 'good' | 'fair' | 'poor' | null;
  harvest_notes?: string | null; // Storage method, taste notes, etc.
  // Bed association (Phase B2)
  bed_id?: string | null;
  created_at: string;
}

// ─── Reference Screen Types (Phase A) ────────────────────────────────────────

export type PestCategory = 'sap_sucking' | 'mites' | 'borers_larvae' | 'beetles_weevils' | 'other';

export type DiseaseCategory = 'fungal' | 'bacterial' | 'viral' | 'physiological';

export type RiskLevel = 'low' | 'moderate' | 'high';
export type TreatmentEffort = 'easy' | 'moderate' | 'advanced';
export type ControlMethod = 'spray' | 'trap' | 'biocontrol' | 'soil' | 'manual' | 'cultural';

export interface OrganicControlItem {
  name: string;
  method: ControlMethod;
  effort: TreatmentEffort;
  howToApply?: string;
  frequency?: string;
  timing?: string;
  safetyNotes?: string;
}

export interface PestEntry {
  id: string;
  name: string;
  tamilName?: string;
  scientificName?: string;
  category: PestCategory;
  emoji: string;
  identification: string;
  damageDescription: string;
  organicPrevention: string[];
  organicTreatments: OrganicControlItem[];
  seasonalRisk?: Partial<Record<string, RiskLevel>>;
  plantsAffected: string[];
  imageAsset?: string;
}

export interface DiseaseEntry {
  id: string;
  name: string;
  tamilName?: string;
  scientificName?: string;
  category: DiseaseCategory;
  emoji: string;
  identification: string;
  damageDescription: string;
  organicPrevention: string[];
  organicTreatments: OrganicControlItem[];
  seasonalRisk?: Partial<Record<string, RiskLevel>>;
  plantsAffected: string[];
  imageAsset?: string;
}

export type OrganicInputCategory =
  | 'fertilizers'
  | 'growth_promoters'
  | 'soil_amendments'
  | 'biopesticides'
  | 'other';

export interface OrganicInputEntry {
  id: string;
  name: string;
  tamilName?: string;
  category: OrganicInputCategory;
  emoji: string;
  description: string;
  ingredients?: string[];
  applicationRate?: string;
  applicationTiming?: string;
  benefits?: string[];
  precautions?: string[];
  storageTips?: string;
  plantsIdeal: string[];
  imageAsset?: string;
}

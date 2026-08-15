import type { VisualIconKey } from '@/types/visual.types';

export type SpaceType = 'pot' | 'bed' | 'ground';

// ─── Farm Setup Types (Phase B3) ─────────────────────────────────────────────

export type FarmGoal = 'self_sufficiency' | 'surplus_sale' | 'seed_saving' | 'medicinal' | 'fodder';

export interface FarmConfig {
  /** @deprecated moved to LocationProfile.land_cents per-plot */
  land_cents?: number;
  families_count: number;
  goals: FarmGoal[];
  /** Display name shown on the More tab account header. */
  owner_name?: string;
  /** Tamil Nadu district selected during onboarding. Defaults to Kanyakumari. */
  district?: string;
  /** Agro-climatic zone id derived from the district. Drives seasons/watering. */
  zone_id?: string;
  updated_at?: string;
}

// ─── Bed Management Types (Phase B2) ─────────────────────────────────────────

export type BedType =
  | 'leafy'
  | 'fruiting'
  | 'spice'
  | 'root_legume'
  | 'climber_trellis'
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
  | 'harvest_leaves'
  | 'weeding'
  | 'transplanting'
  | 'cultivating';
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
  PestDisease = 'pest_disease',
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
// ─── Journal pest/disease + milestone + harvest vocab ────────────────────────
export type PestDiseaseKind = 'pest' | 'disease';
export type PestStatus = 'active' | 'treated' | 'resolved';
export type TreatmentEffectiveness = 'effective' | 'partially_effective' | 'ineffective';
export type MilestoneKind =
  | 'germinated'
  | 'first_flower'
  | 'first_fruit'
  | 'first_harvest'
  | 'transplanted'
  | 'pruned'
  | 'season_end'
  | 'custom';
export type HarvestUnit = 'kg' | 'g' | 'pcs' | 'bunches';
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
  is_resting?: boolean;
  resting_until?: string | null;
  last_water_date?: string | null;
  last_jeevamrutha_date?: string | null;
  last_weeding_date?: string | null;
  notes?: string | null;
  quick_start_applied?: boolean;
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

// ─── Phase C: Farm Alerts (dashboard "Needs Attention") ──────────────────────

export type FarmAlertType =
  | 'harvest_due'
  | 'water_needed'
  | 'fertilise_due'
  | 'trellis_repair'
  | 'prune_due'
  | 'rotation_due'
  | 'pest_spotted'
  | 'bed_resting_end'
  | 'health_sick'
  | 'health_stressed';

export type FarmAlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Aggregated, derived dashboard alert. Computed on-the-fly from already-loaded
 * plants/beds/tasks — never persisted to Firestore.
 */
export interface FarmAlert {
  id: string;
  type: FarmAlertType;
  bedId?: string;
  plantId?: string;
  /**
   * Backing task template, when the alert presents a real scheduled task rather
   * than a template-less condition (sick plant, harvest readiness, green manure).
   * Its presence is what lets the card complete the task for real.
   */
  templateId?: string;
  /** Display heading (e.g. plant or bed name). */
  title: string;
  /** Short action/explanation line. */
  message: string;
  severity: FarmAlertSeverity;
  /** Platform-neutral icon resolved by the UI; alerts are never persisted. */
  iconKey: VisualIconKey;
  /** Sortable urgency — higher is more urgent. */
  daysOverdue: number;
  created_at: string;
}

// ─── Phase C: Weather (Open-Meteo) ───────────────────────────────────────────

export interface DailyWeather {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  tempMaxC: number;
  tempMinC: number;
  /** Total precipitation in mm for the day. */
  precipitationMm: number;
  /** Open-Meteo daily WMO weather code. Null only for a normalized legacy cache entry. */
  weatherCode: number | null;
  /** Maximum daily precipitation probability (0-100). Null for legacy/unavailable data. */
  precipitationProbabilityPct: number | null;
}

export interface WeatherForecast {
  latitude: number;
  longitude: number;
  /** 7-day daily forecast, soonest first. */
  daily: DailyWeather[];
  /** IANA timezone used to build the provider's daily buckets. */
  timezone: string;
  /** ISO timestamp the forecast was fetched. */
  fetched_at: string;
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

// ─── Today briefing view-model (derived, never persisted) ────────────────────

/**
 * Bucket for plants/beds/tasks whose parent location is blank. Kept as an
 * explicit plot rather than dropped, so the plot cards' counts always add up to
 * the header's account-wide total.
 */
export const UNASSIGNED_PLOT_ID = '__unassigned__';

export type WeatherConditionId =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy_rain'
  | 'showers'
  | 'heavy_showers'
  | 'snow'
  | 'thunderstorm'
  | 'hot'
  | 'unknown';

export interface PlotWeatherBrief {
  lat: number;
  lng: number;
  /** Drives the forecast overlay's "district reading, not this plot" banner. */
  source: 'plot' | 'district' | 'default';
  /** The whole 7-day forecast, so the overlay opens without a second fetch. */
  forecast: WeatherForecast | null;
  /** The entry in `forecast.daily` whose date is today — not necessarily `daily[0]`. */
  today: DailyWeather | null;
  condition: WeatherConditionId;
  conditionLabel: string;
  conditionIconKey: VisualIconKey;
  fetched_at: string | null;
  /** True once the forecast is past the weather service's freshness window. */
  stale: boolean;
  /** True while this plot's forecast is being fetched or revalidated. */
  loading: boolean;
}

/** One count per `HealthStatus` — the shape `getPlantHealthSummary` returns. */
export interface PlotHealthCounts {
  healthy: number;
  stressed: number;
  recovering: number;
  sick: number;
  total: number;
}

/**
 * Beds on a plot split by lifecycle — the same precedence `getBedStatus` uses
 * (permanent > resting > empty > growing), so a bed lands in exactly one bucket
 * and `total` equals the plot's `bedCount`.
 */
export interface PlotBedCounts {
  growing: number;
  resting: number;
  empty: number;
  permanent: number;
  total: number;
}

/**
 * The plot card's one line of context — what is going on here, as opposed to
 * the standing counts around it. Both halves are nullable and the card renders
 * nothing at all when both are, so a plot with no history shows no empty row.
 */
/**
 * Which rung of `buildPlotBriefLine`'s ladder produced the headline: an overdue
 * job, rain closing a window, or what today's load consists of.
 */
export type PlotBriefLineKind = 'overdue' | 'rain' | 'load';

export interface PlotBriefLine {
  /** The rung `headline` came from, or null when there is no headline. */
  kind: PlotBriefLineKind | null;
  /**
   * The single most decision-changing signal for this plot, or null on a quiet
   * one — where the title row already says "Nothing due" and repeating it would
   * waste the line.
   */
  headline: string | null;
  /**
   * When work was last recorded here, from the beds' and plants' `last_*`
   * dates. Null when none of them is set. Says "worked", not "walked": those
   * fields only cover watering, jeevamrutha, weeding, fertilising and
   * harvesting, so an unlogged visit leaves no trace.
   */
  freshness: string | null;
}

/** One plot card on the Today screen. */
export interface PlotBrief {
  /** Parent location name, or `UNASSIGNED_PLOT_ID`. Stable list key. */
  id: string;
  name: string;
  /** False for the unassigned bucket, unrecognised parents, and the no-plots fallback card. */
  isConfigured: boolean;
  district: string | null;
  /** Plants in pots and ground only — bed plants are counted by `bedCount`. */
  cropCount: number;
  bedCount: number;
  /** The same beds `bedCount` totals, split by lifecycle for the card's bed strip. */
  bedStatus: PlotBedCounts;
  dueCount: number;
  overdueCount: number;
  /** Same scope as `cropCount`: pots and ground, so it matches the plant list. */
  health: PlotHealthCounts;
  weather: PlotWeatherBrief;
  /** One line of context between the facts line and the weather chip. */
  line: PlotBriefLine;
}

export interface SeasonProgress {
  seasonId: string;
  /** Short name, e.g. "SW Monsoon". */
  seasonName: string;
  /** Full label with its month range, e.g. "SW Monsoon (Jun–Sep)". */
  seasonLabel: string;
  monthLabel: string;
  /** 1-based week within the season. */
  week: number;
  totalWeeks: number;
  elapsedDays: number;
  totalDays: number;
  /** 0–1. Drives the two-segment progress bar. */
  elapsedFraction: number;
}

/** How a crop should be established in the current month. */
export type PlantNowAction = 'sow' | 'transplant';

/** One curated crop chip in the Today screen's seasonal card. */
export interface PlantNowRecommendation {
  key: string;
  label: string;
  action: PlantNowAction;
}

/** A single seasonal reminder for perennials already established on the farm. */
export interface PerennialCareBrief {
  count: number;
  message: string;
}

/**
 * One row in the Today screen's "Needs action" queue: an exception plus where it
 * is. Built by `buildNeedsActionItems`, which resolves the alert's plant/bed id
 * against the plot grouping.
 */
export interface NeedsActionItem {
  alert: FarmAlert;
  /**
   * "Home farm · Bed 3", "Home farm", "Bed 3", or "" when neither segment
   * applies — the row omits the line rather than printing a stray separator.
   */
  where: string;
}

/**
 * Everything the Today screen renders, assembled by `useTodayBrief` so the
 * screen composes blocks rather than deriving data.
 */
export interface TodayBrief {
  /** Pre-formatted, e.g. "Friday 31 July". */
  dateLabel: string;
  /** Work still owed today: due plus overdue, completions removed. */
  remainingTasks: number;
  needActionCount: number;
  plots: PlotBrief[];
  needsAction: NeedsActionItem[];
  season: SeasonProgress;
  seasonNote: string;
  seasonTip: string;
  district: string | null;
  plantNow: PlantNowRecommendation[];
  /** Total suggestions available, so the chip row can offer "All N ›". */
  perennialCare: PerennialCareBrief | null;
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
  // Hybrid record discriminator. Missing on legacy docs → read as 'specimen'.
  record_kind?: 'specimen' | 'row';
  // Number of plants in a row-record. Present iff record_kind === 'row'.
  plant_count?: number;
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
  // Skip tracking — set by the Care Plan's skip action so the "why" survives
  // past the confirmation alert and can be surfaced on the task detail sheet.
  last_skipped_at?: string | null;
  last_skip_reason?: string | null;
  skip_count?: number | null;
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
  harvest_unit?: string | null; // HarvestUnit for new entries; legacy: 'lbs'/'pieces'
  harvest_quality?: 'excellent' | 'good' | 'fair' | 'poor' | null;
  harvest_notes?: string | null; // Storage method, taste notes, etc.
  // For coconut groves (record_kind 'row'): which tree this harvest came from (B.6)
  harvest_tree_number?: number | null;
  // Pest/Disease tracking fields (entry_type 'pest_disease')
  pest_kind?: PestDiseaseKind | null;
  pest_name?: string | null;
  pest_severity?: IssueSeverity | null;
  pest_status?: PestStatus | null;
  pest_occurred_at?: string | null; // Local YYYY-MM-DD the issue was observed
  pest_affected_parts?: string[] | null;
  pest_treatment?: string | null;
  pest_treatment_effectiveness?: TreatmentEffectiveness | null;
  pest_resolved_at?: string | null; // Set when pest_status becomes 'resolved'
  // Milestone tracking (entry_type 'milestone')
  milestone_kind?: MilestoneKind | null;
  // Bed association (Phase B2)
  bed_id?: string | null;
  created_at: string;
}

// ─── Reference Screen Types (Phase A) ────────────────────────────────────────

export type PestCategory = 'sap_sucking' | 'mites' | 'borers_larvae' | 'beetles_weevils' | 'other';

export type DiseaseCategory = 'fungal' | 'bacterial' | 'viral' | 'phytoplasma' | 'physiological';

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
  /**
   * Id of the farm-scaled DIY recipe in `ORGANIC_RECIPES` that prepares this
   * input, when one exists. Typed as `string` rather than `RecipeId` to keep
   * `src/config` from being imported by the type module — narrow it at the use
   * site with `getRecipeById`.
   */
  recipeId?: string;
}

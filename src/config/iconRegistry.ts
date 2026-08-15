import type { Ionicons } from '@expo/vector-icons';
import type {
  BedLayer,
  BedType,
  FarmAlertType,
  GrowthStage,
  TaskType,
  WeatherConditionId,
} from '@/types/database.types';
import type { VisualIconKey } from '@/types/visual.types';
import type { TreatmentMethod } from '@/utils/plantHelpers';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export type IconDefinition =
  | { kind: 'ionicon'; name: IoniconName }
  | { kind: 'bed'; bedType: BedType };

export const TASK_ICON_KEYS: Record<TaskType, VisualIconKey> = {
  water: 'task.water',
  fertilise: 'task.fertilise',
  prune: 'task.prune',
  repot: 'task.repot',
  spray: 'task.spray',
  mulch: 'task.mulch',
  harvest: 'task.harvest',
  harvest_leaves: 'task.harvest_leaves',
  weeding: 'task.weeding',
  transplanting: 'task.transplanting',
  cultivating: 'task.cultivating',
};

export const ALERT_ICON_KEYS: Record<FarmAlertType, VisualIconKey> = {
  harvest_due: 'alert.harvest_due',
  water_needed: 'alert.water_needed',
  fertilise_due: 'alert.fertilise_due',
  trellis_repair: 'alert.trellis_repair',
  prune_due: 'alert.prune_due',
  pest_spotted: 'alert.pest_spotted',
  rotation_due: 'alert.rotation_due',
  bed_resting_end: 'alert.bed_resting_end',
  health_sick: 'alert.health_sick',
  health_stressed: 'alert.health_stressed',
};

export const WEATHER_ICON_KEYS: Record<WeatherConditionId, VisualIconKey> = {
  clear: 'weather.clear',
  partly_cloudy: 'weather.partly_cloudy',
  cloudy: 'weather.cloudy',
  fog: 'weather.fog',
  drizzle: 'weather.drizzle',
  rain: 'weather.rain',
  heavy_rain: 'weather.heavy_rain',
  showers: 'weather.showers',
  heavy_showers: 'weather.heavy_showers',
  snow: 'weather.snow',
  thunderstorm: 'weather.thunderstorm',
  hot: 'weather.hot',
  unknown: 'weather.unknown',
};

export const GROWTH_STAGE_ICON_KEYS: Record<GrowthStage, VisualIconKey> = {
  seedling: 'growth.seedling',
  vegetative: 'growth.vegetative',
  flowering: 'growth.flowering',
  fruiting: 'growth.fruiting',
  dormant: 'growth.dormant',
  mature: 'growth.mature',
};

export const BED_TYPE_ICON_KEYS: Record<BedType, VisualIconKey> = {
  leafy: 'bed.leafy',
  fruiting: 'bed.fruiting',
  spice: 'bed.spice',
  root_legume: 'bed.root_legume',
  climber_trellis: 'bed.climber_trellis',
  three_sisters: 'bed.three_sisters',
  medicinal_guild: 'bed.medicinal_guild',
};

export const BED_LAYER_ICON_KEYS: Record<BedLayer, VisualIconKey> = {
  canopy: 'layer.canopy',
  climber: 'layer.climber',
  understory: 'layer.understory',
  root: 'layer.root',
  ground_cover: 'layer.ground_cover',
};

export const TREATMENT_ICON_KEYS = {
  spray: 'treatment.spray',
  trap: 'treatment.trap',
  biocontrol: 'treatment.biocontrol',
  soil: 'treatment.soil',
  manual: 'treatment.manual',
  cultural: 'treatment.cultural',
} as const satisfies Record<TreatmentMethod, VisualIconKey>;

export const QUALITY_ICON_KEYS = {
  excellent: 'quality.excellent',
  good: 'quality.good',
  fair: 'quality.fair',
  poor: 'quality.poor',
} as const satisfies Record<'excellent' | 'good' | 'fair' | 'poor', VisualIconKey>;

export const ICON_REGISTRY: Record<VisualIconKey, IconDefinition> = {
  'task.water': { kind: 'ionicon', name: 'water' },
  'task.fertilise': { kind: 'ionicon', name: 'nutrition' },
  'task.prune': { kind: 'ionicon', name: 'cut' },
  'task.repot': { kind: 'ionicon', name: 'move' },
  'task.spray': { kind: 'ionicon', name: 'sparkles' },
  'task.mulch': { kind: 'ionicon', name: 'layers' },
  'task.harvest': { kind: 'ionicon', name: 'basket' },
  'task.harvest_leaves': { kind: 'ionicon', name: 'leaf' },
  'task.weeding': { kind: 'ionicon', name: 'trash-bin' },
  'task.transplanting': { kind: 'ionicon', name: 'swap-horizontal' },
  'task.cultivating': { kind: 'ionicon', name: 'build' },
  'alert.harvest_due': { kind: 'ionicon', name: 'basket' },
  'alert.water_needed': { kind: 'ionicon', name: 'water' },
  'alert.fertilise_due': { kind: 'ionicon', name: 'nutrition' },
  'alert.trellis_repair': { kind: 'ionicon', name: 'construct' },
  'alert.prune_due': { kind: 'ionicon', name: 'cut' },
  'alert.pest_spotted': { kind: 'ionicon', name: 'bug' },
  'alert.rotation_due': { kind: 'ionicon', name: 'sync' },
  'alert.bed_resting_end': { kind: 'ionicon', name: 'leaf' },
  'alert.health_sick': { kind: 'ionicon', name: 'medical' },
  'alert.health_stressed': { kind: 'ionicon', name: 'warning' },
  'weather.clear': { kind: 'ionicon', name: 'sunny' },
  'weather.partly_cloudy': { kind: 'ionicon', name: 'partly-sunny' },
  'weather.cloudy': { kind: 'ionicon', name: 'cloudy' },
  'weather.fog': { kind: 'ionicon', name: 'cloud-outline' },
  'weather.drizzle': { kind: 'ionicon', name: 'rainy-outline' },
  'weather.rain': { kind: 'ionicon', name: 'rainy' },
  'weather.heavy_rain': { kind: 'ionicon', name: 'rainy' },
  'weather.showers': { kind: 'ionicon', name: 'rainy-outline' },
  'weather.heavy_showers': { kind: 'ionicon', name: 'rainy' },
  'weather.snow': { kind: 'ionicon', name: 'snow' },
  'weather.thunderstorm': { kind: 'ionicon', name: 'thunderstorm' },
  'weather.hot': { kind: 'ionicon', name: 'thermometer' },
  'weather.unknown': { kind: 'ionicon', name: 'help-circle-outline' },
  'growth.seedling': { kind: 'ionicon', name: 'leaf-outline' },
  'growth.vegetative': { kind: 'ionicon', name: 'leaf' },
  'growth.flowering': { kind: 'ionicon', name: 'flower' },
  'growth.fruiting': { kind: 'ionicon', name: 'nutrition' },
  'growth.dormant': { kind: 'ionicon', name: 'moon' },
  'growth.mature': { kind: 'ionicon', name: 'leaf' },
  'bed.leafy': { kind: 'bed', bedType: 'leafy' },
  'bed.fruiting': { kind: 'bed', bedType: 'fruiting' },
  'bed.spice': { kind: 'bed', bedType: 'spice' },
  'bed.root_legume': { kind: 'bed', bedType: 'root_legume' },
  'bed.climber_trellis': { kind: 'bed', bedType: 'climber_trellis' },
  'bed.three_sisters': { kind: 'bed', bedType: 'three_sisters' },
  'bed.medicinal_guild': { kind: 'bed', bedType: 'medicinal_guild' },
  'layer.canopy': { kind: 'ionicon', name: 'leaf-outline' },
  'layer.climber': { kind: 'ionicon', name: 'git-branch-outline' },
  'layer.understory': { kind: 'ionicon', name: 'leaf-outline' },
  'layer.root': { kind: 'ionicon', name: 'arrow-down-outline' },
  'layer.ground_cover': { kind: 'ionicon', name: 'flower-outline' },
  'treatment.spray': { kind: 'ionicon', name: 'water-outline' },
  'treatment.trap': { kind: 'ionicon', name: 'square-outline' },
  'treatment.biocontrol': { kind: 'ionicon', name: 'bug-outline' },
  'treatment.soil': { kind: 'ionicon', name: 'layers-outline' },
  'treatment.manual': { kind: 'ionicon', name: 'hand-left-outline' },
  'treatment.cultural': { kind: 'ionicon', name: 'sync-outline' },
  'quality.excellent': { kind: 'ionicon', name: 'star' },
  'quality.good': { kind: 'ionicon', name: 'thumbs-up' },
  'quality.fair': { kind: 'ionicon', name: 'remove-circle-outline' },
  'quality.poor': { kind: 'ionicon', name: 'thumbs-down' },
  'general.plant': { kind: 'ionicon', name: 'leaf-outline' },
  'general.pest': { kind: 'ionicon', name: 'bug-outline' },
  'general.disease': { kind: 'ionicon', name: 'medical-outline' },
  'general.location': { kind: 'ionicon', name: 'location-outline' },
  'general.calendar': { kind: 'ionicon', name: 'calendar-outline' },
  'general.bed': { kind: 'ionicon', name: 'grid-outline' },
  'general.tip': { kind: 'ionicon', name: 'bulb-outline' },
  'general.warning': { kind: 'ionicon', name: 'warning-outline' },
  'general.success': { kind: 'ionicon', name: 'checkmark-circle-outline' },
  'general.partial': { kind: 'ionicon', name: 'alert-circle-outline' },
  'general.error': { kind: 'ionicon', name: 'close-circle-outline' },
  'general.edit': { kind: 'ionicon', name: 'create-outline' },
};

import type React from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type {
  FertiliserType,
  GrowthStage,
  PlantLifecycle,
  PlantType,
  SoilType,
  SpaceType,
  SunlightLevel,
  WaterRequirement,
} from '../types/database.types';
import {
  CATEGORY_FULL_LABELS,
  FERTILISER_LABELS,
  GROWTH_STAGE_LABELS,
  LIFECYCLE_LABELS,
  SOIL_LABELS,
  SUNLIGHT_LABELS,
  WATER_REQUIREMENT_LABELS,
} from './plantLabels';
import { getFrequencyLabel } from './plantFormConstants';
import { formatDateDisplay } from './dateHelpers';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface CarePlanRow {
  key: string;
  icon: IoniconName;
  label: string;
  value: string;
  /** Secondary line under the value (e.g. "Weekly"). */
  detail?: string;
}

export interface CarePlanInput {
  sunlight: SunlightLevel;
  waterRequirement: WaterRequirement;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;
  wateringEnabled: boolean;
  wateringFrequency: string;
  fertilisingEnabled: boolean;
  fertilisingFrequency: string;
  pruningEnabled?: boolean;
  pruningFrequency?: string;
  growthStage?: GrowthStage;
  lifecycle?: PlantLifecycle;
}

const scheduleValue = (enabled: boolean, frequency: string, disabledCopy: string): string => {
  if (!enabled) return disabledCopy;
  const n = parseInt(frequency, 10);
  if (isNaN(n) || n < 1) return 'Not set';
  return n === 1 ? 'Every day' : `Every ${n} days`;
};

const scheduleDetail = (enabled: boolean, frequency: string): string | undefined => {
  if (!enabled) return undefined;
  const label = getFrequencyLabel(frequency);
  // "Every N days" would duplicate the value line; only surface friendly names.
  return label && !label.startsWith('Every') ? label : undefined;
};

/** Builds the read-only care-plan rows shown in the wizard Review step and the edit form. */
export function buildCarePlanRows(input: CarePlanInput): CarePlanRow[] {
  const rows: CarePlanRow[] = [
    {
      key: 'sunlight',
      icon: 'sunny-outline',
      label: 'Sunlight',
      value: SUNLIGHT_LABELS[input.sunlight] ?? input.sunlight,
    },
    {
      key: 'waterNeeds',
      icon: 'water-outline',
      label: 'Water needs',
      value: WATER_REQUIREMENT_LABELS[input.waterRequirement] ?? input.waterRequirement,
    },
    {
      key: 'watering',
      icon: 'rainy-outline',
      label: 'Watering',
      value: scheduleValue(input.wateringEnabled, input.wateringFrequency, 'No task · rain-fed or manual'),
      detail: scheduleDetail(input.wateringEnabled, input.wateringFrequency),
    },
    {
      key: 'feeding',
      icon: 'nutrition-outline',
      label: 'Feeding',
      value: scheduleValue(
        input.fertilisingEnabled,
        input.fertilisingFrequency,
        'No task · manual feeding only'
      ),
      detail: scheduleDetail(input.fertilisingEnabled, input.fertilisingFrequency),
    },
    {
      key: 'soil',
      icon: 'layers-outline',
      label: 'Soil',
      value: SOIL_LABELS[input.soilType] ?? input.soilType,
    },
    {
      key: 'fertiliser',
      icon: 'leaf-outline',
      label: 'Fertiliser',
      value: FERTILISER_LABELS[input.preferredFertiliser] ?? input.preferredFertiliser,
    },
  ];

  if (input.pruningEnabled !== undefined) {
    rows.push({
      key: 'pruning',
      icon: 'cut-outline',
      label: 'Pruning',
      value: scheduleValue(
        input.pruningEnabled,
        input.pruningFrequency ?? '',
        'No pruning task scheduled'
      ),
      detail: scheduleDetail(input.pruningEnabled, input.pruningFrequency ?? ''),
    });
  }

  if (input.growthStage) {
    rows.push({
      key: 'growthStage',
      icon: 'trending-up-outline',
      label: 'Starting stage',
      value: GROWTH_STAGE_LABELS[input.growthStage] ?? input.growthStage,
    });
  }

  if (input.lifecycle) {
    rows.push({
      key: 'lifecycle',
      icon: 'sync-outline',
      label: 'Lifecycle',
      value: LIFECYCLE_LABELS[input.lifecycle] ?? input.lifecycle,
    });
  }

  return rows;
}

const SPACE_TYPE_LABELS: Record<SpaceType, string> = {
  ground: 'Ground',
  bed: 'Raised Bed',
  pot: 'Pot',
};

export interface PlantSummaryInput {
  plantVariety: string;
  plantType: PlantType | string;
  variety: string;
  plantingDate: string;
  harvestSeason: string;
  /** Combined location preview (falls back to parent/child below). */
  location: string;
  parentLocation: string;
  childLocation: string;
  landmarks: string;
  spaceType: SpaceType;
  potSize: string;
  bedName: string;
  name: string;
}

/** Builds the read-only "Your plant" selection rows shown in the wizard Review step. */
export function buildPlantSummaryRows(input: PlantSummaryInput): CarePlanRow[] {
  const rows: CarePlanRow[] = [];

  const categoryLabel = CATEGORY_FULL_LABELS[input.plantType as PlantType];
  if (input.plantVariety) {
    rows.push({
      key: 'plant',
      icon: 'leaf-outline',
      label: 'Plant',
      value: input.plantVariety,
      detail: categoryLabel,
    });
  }

  if (input.variety.trim()) {
    rows.push({
      key: 'variety',
      icon: 'flower-outline',
      label: 'Variety',
      value: input.variety.trim(),
    });
  }

  if (input.plantingDate) {
    rows.push({
      key: 'plantingDate',
      icon: 'calendar-outline',
      label: 'Planted',
      value: formatDateDisplay(input.plantingDate),
    });
  }

  if (input.harvestSeason) {
    rows.push({
      key: 'harvestSeason',
      icon: 'basket-outline',
      label: 'Harvest season',
      value: input.harvestSeason,
    });
  }

  const location =
    input.location.trim() || [input.parentLocation, input.childLocation].filter(Boolean).join(' · ');
  if (location) {
    rows.push({
      key: 'location',
      icon: 'location-outline',
      label: 'Location',
      value: location,
      detail: input.landmarks.trim() || undefined,
    });
  }

  const spaceLabel = SPACE_TYPE_LABELS[input.spaceType] ?? input.spaceType;
  rows.push({
    key: 'space',
    icon: 'cube-outline',
    label: 'Growing space',
    value: input.spaceType === 'pot' && input.potSize.trim() ? `${spaceLabel} · ${input.potSize.trim()}"` : spaceLabel,
    detail: input.spaceType === 'bed' && input.bedName.trim() ? input.bedName.trim() : undefined,
  });

  if (input.name.trim()) {
    rows.push({
      key: 'nickname',
      icon: 'pricetag-outline',
      label: 'Nickname',
      value: input.name.trim(),
    });
  }

  return rows;
}

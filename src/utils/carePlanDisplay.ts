import type React from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type {
  FertiliserType,
  GrowthStage,
  PlantLifecycle,
  SoilType,
  SunlightLevel,
  WaterRequirement,
} from '../types/database.types';
import {
  FERTILISER_LABELS,
  GROWTH_STAGE_LABELS,
  LIFECYCLE_LABELS,
  SOIL_LABELS,
  SUNLIGHT_LABELS,
  WATER_REQUIREMENT_LABELS,
} from './plantLabels';
import { getFrequencyLabel } from './plantFormConstants';

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

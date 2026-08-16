/**
 * Compatibility adapter for older callers. Today uses the reviewed,
 * zone-keyed Tamil Nadu rule registry directly.
 */

import {
  getTamilNaduPlantingWindows,
  TAMIL_NADU_PLANTING_RULES,
} from '@/config/tamilNaduPlantingCalendar';
import type { PlantNowAction, PlantType } from '@/types/database.types';

export interface KanyakumariPlantingEntry {
  plantType: PlantType;
  variety: string;
  action: PlantNowAction;
}

const toEntry = (rule: (typeof TAMIL_NADU_PLANTING_RULES)[number]): KanyakumariPlantingEntry => ({
  plantType: rule.plantType,
  variety: rule.plantName,
  action: rule.action,
});

export const KANYAKUMARI_PLANTING_CALENDAR: Readonly<
  Record<number, readonly KanyakumariPlantingEntry[]>
> = Object.fromEntries(
  Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return [
      month,
      TAMIL_NADU_PLANTING_RULES.filter(
        (rule) => rule.zones.includes('high_rainfall') && rule.months.includes(month)
      ).map(toEntry),
    ];
  })
);

export function getKanyakumariPlantingRecommendations(
  date: Date = new Date()
): readonly KanyakumariPlantingEntry[] {
  return KANYAKUMARI_PLANTING_CALENDAR[date.getMonth() + 1] ?? [];
}

export interface PlantingWindows {
  current: readonly KanyakumariPlantingEntry[];
  closing: readonly KanyakumariPlantingEntry[];
  openingNext: readonly KanyakumariPlantingEntry[];
}

export function getKanyakumariPlantingWindows(date: Date = new Date()): PlantingWindows {
  const windows = getTamilNaduPlantingWindows('high_rainfall', date);
  return {
    current: windows.current.map(toEntry),
    closing: windows.closing.map(toEntry),
    openingNext: windows.openingNext.map(toEntry),
  };
}

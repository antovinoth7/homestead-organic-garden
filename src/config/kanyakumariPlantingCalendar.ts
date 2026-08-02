/**
 * Kanyakumari home-garden planting calendar.
 *
 * Crop windows are conservatively derived from TNAU's home/roof-garden guide:
 * https://agritech.tnau.ac.in/horticulture/horti_Landscaping_types%20of%20garden.html
 * The district's June-September SW monsoon and October-December NE monsoon
 * boundaries follow the TNAU Kanyakumari district contingency plan:
 * https://agritech.tnau.ac.in/ta/district_contigency_plan/pdf/TN20-KANYAKUMARI%2031.3.3011.pdf
 *
 * This is intentionally a small food-crop calendar. Trees, plantation crops,
 * ornamentals, and medicinal perennials belong in long-term farm planning, not
 * in a daily "Plant now" prompt.
 */

import type { PlantNowAction, PlantType } from '@/types/database.types';

export interface KanyakumariPlantingEntry {
  plantType: PlantType;
  variety: string;
  action: PlantNowAction;
}

const sow = (variety: string, plantType: PlantType = 'vegetable'): KanyakumariPlantingEntry => ({
  plantType,
  variety,
  action: 'sow',
});

const transplant = (variety: string): KanyakumariPlantingEntry => ({
  plantType: 'vegetable',
  variety,
  action: 'transplant',
});

/** Month number (1-12) to ordered, direct-sow then transplant suggestions. */
export const KANYAKUMARI_PLANTING_CALENDAR: Readonly<Record<number, readonly KanyakumariPlantingEntry[]>> = {
  1: [sow('Cowpea'), sow('Radish'), transplant('Brinjal'), transplant('Chilli'), transplant('Tomato')],
  2: [
    sow('Amaranthus'),
    sow('Bitter Gourd'),
    sow('Cucumber'),
    sow('Cowpea'),
    sow('Radish'),
    transplant('Brinjal'),
    transplant('Chilli'),
    transplant('Tomato'),
  ],
  3: [sow('Amaranthus'), sow('Bitter Gourd'), sow('Cucumber'), sow('Radish')],
  4: [sow('Amaranthus')],
  5: [sow('Amaranthus')],
  6: [
    sow('Ladies Finger'),
    sow('Ash Gourd'),
    sow('Bitter Gourd'),
    sow('Pumpkin'),
    transplant('Onion'),
    transplant('Tomato'),
  ],
  7: [
    sow('Ladies Finger'),
    sow('Amaranthus'),
    sow('Cluster Beans'),
    sow('Ash Gourd'),
    sow('Pumpkin'),
    transplant('Onion'),
    transplant('Tomato'),
    transplant('Brinjal'),
    transplant('Chilli'),
  ],
  8: [
    sow('Amaranthus'),
    sow('Ladies Finger'),
    sow('Ash Gourd'),
    sow('Pumpkin'),
    sow('Snake Gourd'),
    transplant('Brinjal'),
    transplant('Chilli'),
  ],
  9: [sow('Fenugreek'), sow('Spinach', 'spinach'), sow('Turnip'), sow('Beans')],
  10: [
    sow('Beetroot'),
    sow('Fenugreek'),
    sow('Spinach', 'spinach'),
    sow('Turnip'),
    transplant('Onion'),
  ],
  11: [sow('Beetroot'), sow('Fenugreek'), transplant('Onion')],
  12: [sow('Beetroot'), sow('Fenugreek'), sow('Radish'), transplant('Tomato')],
};

export function getKanyakumariPlantingRecommendations(
  date: Date = new Date()
): readonly KanyakumariPlantingEntry[] {
  return KANYAKUMARI_PLANTING_CALENDAR[date.getMonth() + 1] ?? [];
}

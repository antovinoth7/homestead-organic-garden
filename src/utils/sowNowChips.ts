/**
 * Curated "Plant now" chips for the Today screen's season block.
 *
 * Turns source-reviewed suggestions into the chip
 * shape the block renders. Artwork is resolved by the UI from the plant name,
 * keeping this derived model independent from React Native image sources.
 */

import { PlantNowRecommendation, PlantType } from '@/types/database.types';

export interface PlantNowCandidate {
  plantType: PlantType;
  variety: string;
  action: PlantNowRecommendation['action'];
}

export function toPlantNowChips(suggestions: readonly PlantNowCandidate[]): PlantNowRecommendation[] {
  return suggestions.map((crop) => {
    return {
      key: `${crop.plantType}:${crop.variety}`,
      label: crop.variety,
      action: crop.action,
    };
  });
}

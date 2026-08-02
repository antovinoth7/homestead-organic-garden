/**
 * Curated "Plant now" chips for the Today screen's season block.
 *
 * Turns source-reviewed suggestions into the chip
 * shape the block renders. The emoji ladder — catalog entry, then plant-type
 * tier, then a generic seedling — is lifted out of `SeasonPanel` so it can be
 * unit-tested rather than re-derived inside a component.
 */

import { PlantNowRecommendation, PlantType } from '@/types/database.types';
import { getPlantEmoji } from '@/utils/plantHelpers';

const GENERIC_EMOJI = '🌱';

/** Fallback tier when a variety has no entry in the catalog emoji map. */
const TYPE_EMOJI: Record<string, string> = {
  vegetable: '🥕',
  herb: '🌿',
  flower: '🌼',
  fruit_tree: '🌳',
  timber_tree: '🪵',
  coconut_tree: '🥥',
  shrub: '🌱',
  spinach: '🥬',
};

export interface PlantNowCandidate {
  plantType: PlantType;
  variety: string;
  action: PlantNowRecommendation['action'];
}

export function toPlantNowChips(suggestions: readonly PlantNowCandidate[]): PlantNowRecommendation[] {
  return suggestions.map((crop) => {
    const catalogEmoji = getPlantEmoji(crop.variety);
    const emoji =
      catalogEmoji === GENERIC_EMOJI ? TYPE_EMOJI[crop.plantType] ?? GENERIC_EMOJI : catalogEmoji;
    return {
      key: `${crop.plantType}:${crop.variety}`,
      emoji,
      label: crop.variety,
      action: crop.action,
    };
  });
}

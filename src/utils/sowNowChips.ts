/**
 * Curated "Plant now" tiles for the Today screen's season block.
 *
 * Turns source-reviewed suggestions into the tile shape the block renders.
 * Artwork is resolved by the UI from the plant name, keeping this derived model
 * independent from React Native image sources.
 *
 * The catalog lookup arrives as a function rather than a `PlantProfiles` map so
 * this stays a pure util with no service import; the hook already holds the
 * profiles and passes `getProfileEntry` bound to them.
 */

import { PlantNowRecommendation, PlantProfile, PlantType } from '@/types/database.types';

export interface PlantNowCandidate {
  plantType: PlantType;
  variety: string;
  action: PlantNowRecommendation['action'];
}

export interface PlantNowContext {
  /** Catalog entry for a crop, or undefined when it has no profile. */
  lookup?: (plantType: PlantType, name: string) => PlantProfile | undefined;
  /** Keys whose window closes at the end of this month. */
  closingKeys?: ReadonlySet<string>;
  /** The day the crop would be started. Injectable so the tests are fixed. */
  today?: Date;
}

/**
 * "25–40 days", or "40 days" when the profile states a single figure. Returns
 * null rather than a placeholder so the tile can drop the line entirely.
 */
function formatDaysToHarvest(profile: PlantProfile | undefined): string | null {
  const range = profile?.daysToHarvest;
  if (!range) return null;
  return range.min === range.max
    ? `${range.max} days`
    : `${range.min}–${range.max} days`;
}

/**
 * The month a crop started today would come good in, measured from the outer
 * bound of its range — the figure a grower can plan a bed around without being
 * caught short.
 *
 * The date is walked with the local-time `new Date(y, m, d + days)` constructor
 * rather than millisecond arithmetic, for the same reason `seasonProgress` does:
 * no timezone or DST shift can then push the result into a neighbouring month.
 * The year is stated only once it differs from today's, so the common case stays
 * three characters wide on a tile.
 */
function formatHarvestBy(profile: PlantProfile | undefined, today: Date): string | null {
  const range = profile?.daysToHarvest;
  if (!range) return null;

  const landing = new Date(today.getFullYear(), today.getMonth(), today.getDate() + range.max);
  const sameYear = landing.getFullYear() === today.getFullYear();
  const month = landing.toLocaleDateString('en-US', {
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return `harvest by ${month}`;
}

export function toPlantNowChips(
  suggestions: readonly PlantNowCandidate[],
  context: PlantNowContext = {}
): PlantNowRecommendation[] {
  const { lookup, closingKeys, today = new Date() } = context;

  return suggestions.map((crop) => {
    const key = `${crop.plantType}:${crop.variety}`;
    const profile = lookup?.(crop.plantType, crop.variety);

    return {
      key,
      label: crop.variety,
      plantType: crop.plantType,
      action: crop.action,
      daysToHarvest: formatDaysToHarvest(profile),
      harvestByLabel: formatHarvestBy(profile, today),
      spacingCm: profile?.spacingCm ?? null,
      closing: closingKeys?.has(key) ?? false,
    };
  });
}

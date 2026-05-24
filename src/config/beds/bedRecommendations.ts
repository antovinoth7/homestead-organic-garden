/**
 * Land area (cents) → recommended bed count, path width, and sizing guidance.
 * 1 cent = 40.47 sqm (Tamil Nadu standard).
 */

export interface BedRecommendation {
  land_cents: number;
  max_beds: number;
  path_width_cm: number;
  bed_width_m: number;
  bed_length_m: number;
  rationale: string;
}

const RECOMMENDATIONS: BedRecommendation[] = [
  {
    land_cents: 1,
    max_beds: 2,
    path_width_cm: 45,
    bed_width_m: 1.2,
    bed_length_m: 3,
    rationale: 'Compact layout — 2 beds with narrow paths.',
  },
  {
    land_cents: 2,
    max_beds: 4,
    path_width_cm: 45,
    bed_width_m: 1.2,
    bed_length_m: 3,
    rationale: '4 beds arranged in 2×2 grid with access paths.',
  },
  {
    land_cents: 5,
    max_beds: 8,
    path_width_cm: 60,
    bed_width_m: 1.2,
    bed_length_m: 4,
    rationale: '8 beds with comfortable 60 cm paths for wheelbarrow access.',
  },
  {
    land_cents: 10,
    max_beds: 14,
    path_width_cm: 60,
    bed_width_m: 1.2,
    bed_length_m: 5,
    rationale: '14 beds — enough for 4-season rotation with 2 resting beds.',
  },
  {
    land_cents: 20,
    max_beds: 24,
    path_width_cm: 75,
    bed_width_m: 1.5,
    bed_length_m: 5,
    rationale: '24 beds — wide paths for cart access, room for composting area.',
  },
  {
    land_cents: 50,
    max_beds: 40,
    path_width_cm: 90,
    bed_width_m: 1.5,
    bed_length_m: 6,
    rationale: '40 beds — large-scale organic farm with machinery-width paths.',
  },
  {
    land_cents: 100,
    max_beds: 60,
    path_width_cm: 100,
    bed_width_m: 1.5,
    bed_length_m: 8,
    rationale: '60 beds — full farm layout with zones for each guild type.',
  },
];

/**
 * Returns the bed recommendation closest to (but not exceeding) the given land area.
 * If land_cents is smaller than the smallest entry, returns the smallest recommendation.
 */
export function getBedRecommendationForArea(landCents: number): BedRecommendation {
  let best = RECOMMENDATIONS[0]!;
  for (const rec of RECOMMENDATIONS) {
    if (rec.land_cents <= landCents) {
      best = rec;
    }
  }
  return best;
}

/**
 * Calculate usable bed area from total land, accounting for paths and borders.
 * @returns usable sqm for beds (excludes paths)
 */
export function getUsableBedArea(landCents: number): number {
  const totalSqm = landCents * 40.47;
  const rec = getBedRecommendationForArea(landCents);
  // Approx 30% of land goes to paths + borders
  const pathFraction = rec.path_width_cm >= 90 ? 0.35 : rec.path_width_cm >= 60 ? 0.3 : 0.25;
  return Math.round(totalSqm * (1 - pathFraction));
}

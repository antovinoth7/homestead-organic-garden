/**
 * Rotation behaviour per crop family — rest period, and how many seasons before
 * the same family may return.
 *
 * Its own module because both the soil-prep steps and the rotation rules need
 * it: `soilPrepEngine` renders the rest period, `rotationRules` enforces the
 * season gap. It used to be split between a `REST_BY_PREV_CROP` table here and a
 * lone `SOLANACEAE_REST_SEASONS = 2` constant in `rotationRules`, which meant the
 * "no same family two seasons running" rule only ever applied to solanaceae.
 *
 * `restSeasons` is for the families where the concern is carry-over across
 * seasons rather than days of rest — soil-borne pathogens that a fortnight does
 * nothing about. `rotationRules` reads it for the "same family two seasons in a
 * row" check, which used to be a solanaceae-only constant.
 *
 * The first six entries predate this table being generalised and are unsourced,
 * as the rest of this file is. The entries marked REVIEW are drafted from the
 * rotation principle named in each `reason` and are waiting on local
 * confirmation — see the note above `NEXT_CROP_AFTER` in BedSuccessionTimeline.
 */
export interface CropFamilyRotation {
  /** Rest period to render in the soil-prep steps. */
  days: string;
  /** Why, shown to the farmer alongside the rest step. */
  reason: string;
  /** Seasons before this family may return to the bed, where days are not the concern. */
  restSeasons?: number;
}

export const REST_BY_PREV_CROP: Record<string, CropFamilyRotation> = {
  solanaceae: {
    days: '14 days',
    reason: 'clear solanaceae soil pathogens',
    restSeasons: 2,
  },
  cucurbit: {
    days: '10 days',
    reason: 'remove vine debris and reset fungal load',
    // Was implicit: `ROW_REST_FAMILIES` listed cucurbit alongside solanaceae for
    // the per-row check while only solanaceae carried a season count. Stating it
    // keeps that behaviour and lets the list be derived from this table.
    restSeasons: 2,
  },
  brassica: { days: '7 days', reason: 'brassica debris mildly inhibits next planting' },
  allium: { days: '14 days', reason: 'allium residue inhibits legume germination' },
  legume: { days: '3 days', reason: 'excellent rotation — minimal rest needed' },
  other: { days: '5 days', reason: 'standard rest between crop families' },

  // REVIEW: drafted from the stated principle, not a sourced figure. Confirm the
  // numbers before release; the reasons are the part I am confident in.
  amaranthaceae: {
    days: '5 days',
    // Quick, light-feeding keerai that leave almost no residue. The risk is not
    // pathogens but repeating the family — Amaranthus, Palak and Beetroot are all
    // Amaranthaceae, which reads as three different crops in a bed plan.
    reason: 'little residue, but do not follow keerai with beetroot or palak',
  },
  malvaceae: {
    days: '10 days',
    // Okra is a long-season crop and a known root-knot nematode host.
    reason: 'okra is a root-knot nematode host — do not follow it with itself',
  },
  convolvulaceae: {
    days: '7 days',
    reason: 'sweet potato leaves the bed loose and low in nitrogen',
  },
  araceae: {
    days: '10 days',
    reason: 'long-duration tubers draw down organic matter heavily',
  },
  zingiberaceae: {
    days: '14 days',
    // Rhizome rot and bacterial wilt persist in the soil, so this one is a
    // multi-season rotation rather than a rest measured in days.
    reason: 'rhizome rot and bacterial wilt carry over in wet soil',
    restSeasons: 3,
  },
  poaceae: {
    days: '7 days',
    reason: 'maize is a heavy nitrogen user and leaves bulky residue',
  },
};

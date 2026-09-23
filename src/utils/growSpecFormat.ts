/**
 * Compact growing-spec formatters for crop rows and tiles.
 *
 * Missing data yields nothing rather than a placeholder — '' from the harvest
 * formatter, null from the spacing one — so callers skip the line entirely: a
 * crop whose care profile carries no harvest range renders its name alone
 * rather than a stub.
 */

import type { NumericRange } from '@/types/database.types';

const DAYS_PER_YEAR = 365;

/**
 * Whether a harvest range states a real wait. Timber trees are never harvested,
 * and older data (or a stored override copied from it) wrote that as `0–0`
 * rather than leaving the field out — that must read as "no figure", not
 * "0 days".
 */
export function isStatedHarvestRange(
  range: NumericRange | null | undefined
): range is NumericRange {
  return !!range && Number.isFinite(range.min) && Number.isFinite(range.max) && range.max > 0;
}

/**
 * A harvest range restated in whole years, or null when its shorter bound is
 * under a year. A tree that takes 4380–5475 days reads as a number to decode;
 * 12–15 years is the figure a grower actually plans around.
 */
export function harvestRangeInYears(range: NumericRange): NumericRange | null {
  if (range.min < DAYS_PER_YEAR) return null;
  return {
    min: Math.round(range.min / DAYS_PER_YEAR),
    max: Math.round(range.max / DAYS_PER_YEAR),
  };
}

/**
 * Harvest duration, e.g. "35 d" for an exact figure or "100–140 d" for a
 * range, or "12–15 yr" once the wait runs past a year. The range is shown
 * whole: collapsing it to one number would imply a precision the care
 * profiles do not carry.
 */
export function formatDaysToHarvest(range?: NumericRange): string {
  if (!isStatedHarvestRange(range)) return '';
  const years = harvestRangeInYears(range);
  const { min, max } = years ?? range;
  const unit = years ? 'yr' : 'd';
  return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
}

/**
 * The distance mark that stands in for the word "apart".
 *
 * U+21C4 is the pair of parallel arrows that Ionicons draws as
 * `swap-horizontal-outline`, which is what labels Spacing on the plant detail
 * screen — the two screens state the same figure, so they carry the same shape.
 * The tile takes the glyph rather than the icon because an icon costs about a
 * sixth of the width the meta line has to spend.
 *
 * Not U+2194, the more obvious arrow: it is classed `Extended_Pictographic` for
 * carrying an emoji presentation variant, so the project's no-functional-emoji
 * policy rejects it and some Android builds would paint a blue arrow in the
 * middle of a grey figure. U+21C4 sits in the base Arrows block, which Roboto
 * covers everywhere; the wider "long arrow" glyphs fall outside that coverage
 * and render as tofu.
 */
const SPACING_MARK = '⇄';

/** The leading measurement of a spacing sentence, e.g. "15 cm apart in rows 45 cm apart". */
const LEADING_MEASURE = /^([\d.]+(?:[-–][\d.]+)?)\s*(cm|m)\b/;

/**
 * A crop tile's spacing figure, marked rather than spelled: the word costs six
 * characters on a card with room for about eighteen, and the mark says the same
 * thing in one.
 *
 * Prefers the catalog's centimetres. Failing those it takes the plant pitch off
 * the front of the calendar's sentence and drops the rest: a sentence like
 * "15 cm apart in rows 45 cm apart" carries a second number no half-width card
 * can hold, and the tile still speaks it in full and still opens the entry that
 * states it.
 */
export function formatSpacingFigure(
  spacingCm: number | null,
  spacingLabel: string | null
): string | null {
  if (spacingCm !== null) return `${SPACING_MARK}${spacingCm} cm`;
  if (spacingLabel === null) return null;
  const match = LEADING_MEASURE.exec(spacingLabel);
  // A label stating no leading measurement keeps its own words rather than
  // taking a mark that may not describe what it says.
  return match ? `${SPACING_MARK}${match[1]} ${match[2]}` : spacingLabel;
}

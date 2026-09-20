import { formatDaysToHarvest, formatSpacingFigure } from '@/utils/growSpecFormat';

describe('formatDaysToHarvest', () => {
  it('returns an empty string when the profile has no range', () => {
    expect(formatDaysToHarvest(undefined)).toBe('');
  });

  it('shows a single figure when the bounds are equal', () => {
    expect(formatDaysToHarvest({ min: 35, max: 35 })).toBe('35 d');
  });

  it('shows both bounds when they differ', () => {
    expect(formatDaysToHarvest({ min: 100, max: 140 })).toBe('100–140 d');
    expect(formatDaysToHarvest({ min: 25, max: 40 })).toBe('25–40 d');
  });
});

describe('formatSpacingFigure', () => {
  it('marks the catalog figure rather than spelling "apart"', () => {
    expect(formatSpacingFigure(15, '15 cm apart')).toBe('⇄15 cm');
    expect(formatSpacingFigure(150, null)).toBe('⇄150 cm');
  });

  it('marks with a plain arrow, never one the emoji policy would reject', () => {
    // U+2194 is Extended_Pictographic; the policy test bans it from source and
    // Android may paint it as a blue emoji arrow inside a grey figure.
    expect(formatSpacingFigure(15, null)).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('takes the plant pitch off a sentence and drops the row pitch', () => {
    // The card has room for one number; the sentence is still spoken in full.
    expect(formatSpacingFigure(null, '15 cm apart in rows 45 cm apart')).toBe('⇄15 cm');
    expect(formatSpacingFigure(null, '10 cm apart in rows 15 cm apart')).toBe('⇄10 cm');
  });

  it('reads a range, and a unit other than centimetres', () => {
    expect(formatSpacingFigure(null, '1.5–2 m apart with a trellis')).toBe('⇄1.5–2 m');
    expect(formatSpacingFigure(null, '60 cm apart')).toBe('⇄60 cm');
  });

  it('leaves a label stating no measurement to its own words', () => {
    expect(formatSpacingFigure(null, 'one per pot')).toBe('one per pot');
  });

  it('yields nothing when the crop states no spacing at all', () => {
    expect(formatSpacingFigure(null, null)).toBeNull();
  });
});

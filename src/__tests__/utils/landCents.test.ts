import { resolveLandCents, sumLandCents, DEFAULT_LAND_CENTS } from '@/utils/landCents';
import type { LocationProfile } from '@/types/database.types';

const profile = (land_cents: number | null): LocationProfile => ({ land_cents });

describe('sumLandCents', () => {
  it('adds up every plot that has a recorded size', () => {
    expect(sumLandCents({ Backyard: profile(12), Terrace: profile(3) })).toBe(15);
  });

  it('treats missing and null sizes as zero', () => {
    expect(sumLandCents({ A: profile(8), B: profile(null), C: {} })).toBe(8);
  });

  it('returns 0 for an empty or absent profile map', () => {
    expect(sumLandCents({})).toBe(0);
    expect(sumLandCents(undefined)).toBe(0);
  });
});

describe('resolveLandCents', () => {
  it('prefers per-plot sizes over the deprecated FarmConfig value', () => {
    expect(resolveLandCents({ A: profile(20) }, { land_cents: 5 })).toBe(20);
  });

  it('falls back to FarmConfig.land_cents when no plot has a size', () => {
    expect(resolveLandCents({ A: profile(null) }, { land_cents: 7 })).toBe(7);
    expect(resolveLandCents({}, { land_cents: 7 })).toBe(7);
    expect(resolveLandCents(undefined, { land_cents: 7 })).toBe(7);
  });

  it('falls back to the default when neither source has a usable size', () => {
    expect(resolveLandCents(undefined, null)).toBe(DEFAULT_LAND_CENTS);
    expect(resolveLandCents({}, undefined)).toBe(DEFAULT_LAND_CENTS);
    expect(resolveLandCents({ A: profile(0) }, { land_cents: 0 })).toBe(DEFAULT_LAND_CENTS);
  });
});

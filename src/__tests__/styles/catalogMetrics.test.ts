import {
  CATALOG_ROW_BASE_HEIGHT,
  CATALOG_SECTION_HEADER_BASE_HEIGHT,
  MAX_CATALOG_FONT_SCALE,
  catalogRowHeight,
  catalogRowTotalHeight,
  catalogSectionHeaderHeight,
  clampFontScale,
} from '@/styles/catalogMetrics';

describe('clampFontScale', () => {
  it('never shrinks below the default layout', () => {
    expect(clampFontScale(0.5)).toBe(1);
    expect(clampFontScale(1)).toBe(1);
  });

  it('caps growth so one plant cannot fill the screen', () => {
    expect(clampFontScale(3)).toBe(MAX_CATALOG_FONT_SCALE);
    expect(clampFontScale(MAX_CATALOG_FONT_SCALE)).toBe(MAX_CATALOG_FONT_SCALE);
  });

  // A non-finite scale falls back to the default layout rather than the cap:
  // garbage in should render the normal list, not the largest possible one.
  it('survives a garbage scale rather than producing NaN heights', () => {
    expect(clampFontScale(Number.NaN)).toBe(1);
    expect(clampFontScale(Number.POSITIVE_INFINITY)).toBe(1);
    expect(catalogRowHeight(Number.NaN)).toBe(CATALOG_ROW_BASE_HEIGHT);
  });
});

describe('catalog heights', () => {
  it('matches the documented base heights at the default scale', () => {
    expect(catalogRowHeight(1)).toBe(CATALOG_ROW_BASE_HEIGHT);
    expect(catalogSectionHeaderHeight(1)).toBe(CATALOG_SECTION_HEADER_BASE_HEIGHT);
  });

  it('defaults to scale 1 when called with no argument', () => {
    expect(catalogRowHeight()).toBe(CATALOG_ROW_BASE_HEIGHT);
    expect(catalogSectionHeaderHeight()).toBe(CATALOG_SECTION_HEADER_BASE_HEIGHT);
  });

  it('grows monotonically with the scale', () => {
    expect(catalogRowHeight(1.3)).toBeGreaterThan(catalogRowHeight(1));
    expect(catalogRowHeight(1.6)).toBeGreaterThan(catalogRowHeight(1.3));
    expect(catalogSectionHeaderHeight(1.6)).toBeGreaterThan(catalogSectionHeaderHeight(1));
  });

  it('stops growing past the clamp', () => {
    expect(catalogRowHeight(3)).toBe(catalogRowHeight(MAX_CATALOG_FONT_SCALE));
    expect(catalogSectionHeaderHeight(3)).toBe(
      catalogSectionHeaderHeight(MAX_CATALOG_FONT_SCALE)
    );
  });

  it('returns whole pixels — a fractional promise to getItemLayout drifts', () => {
    [1, 1.15, 1.3, 1.6].forEach((scale) => {
      expect(Number.isInteger(catalogRowHeight(scale))).toBe(true);
      expect(Number.isInteger(catalogSectionHeaderHeight(scale))).toBe(true);
    });
  });

  it('adds the listCard borders to the row total', () => {
    expect(catalogRowTotalHeight(1)).toBe(catalogRowHeight(1) + 2);
    expect(catalogRowTotalHeight(1.6)).toBe(catalogRowHeight(1.6) + 2);
  });
});

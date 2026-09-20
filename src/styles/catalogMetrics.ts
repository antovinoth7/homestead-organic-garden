/**
 * Catalog list metrics, kept free of any `react-native` import so both the
 * stylesheet and the pure list-building util can read them — and so the util
 * stays testable without the RN transform.
 *
 * These are a contract with `getItemLayout` on the catalog browse list: the
 * numbers here must match what `managePlantCatalogStyles` actually renders, or
 * the list mis-measures and scrolling leaves gaps.
 *
 * The heights are functions of the OS font scale rather than bare constants.
 * A fixed row height silently clips its text once the user turns system font
 * size up, and — worse — leaves `getItemLayout` promising a height the row no
 * longer has. Callers pass `useWindowDimensions().fontScale`, which tracks the
 * setting changing mid-session.
 */

/** Row height at the default font size. */
export const CATALOG_ROW_BASE_HEIGHT = 68;

/** Section header height at the default font size. */
export const CATALOG_SECTION_HEADER_BASE_HEIGHT = 40;

/**
 * The largest scaling the list will follow. Past this the rows stop growing and
 * the text is capped to match (`maxFontSizeMultiplier` on the row's `Text`), so
 * a 3× accessibility setting cannot produce a 200px row that fits one plant on
 * screen. Below 1 nothing shrinks: the layout is already at its minimum.
 */
export const MAX_CATALOG_FONT_SCALE = 1.6;

export function clampFontScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1;
  return Math.min(Math.max(scale, 1), MAX_CATALOG_FONT_SCALE);
}

/**
 * Inner browse-row height: a 36px thumb plus 10px of padding top and bottom,
 * plus the meta line beneath the name. Fixed rather than intrinsic, so a plant
 * with no meta line occupies exactly the same height as one with it.
 *
 * Only the text block grows with the font scale — the thumb and the padding are
 * fixed — so the growth applies to the 32px the two text lines occupy.
 */
export function catalogRowHeight(fontScale = 1): number {
  const textBlock = 32;
  const chrome = CATALOG_ROW_BASE_HEIGHT - textBlock;
  return Math.round(chrome + textBlock * clampFontScale(fontScale));
}

/**
 * What `getItemLayout` reports for a plant row: the inner row plus the 1px top
 * and bottom border `listCard` draws around it. `rowDivider` is positioned
 * absolutely so it contributes nothing. Keep this in step with
 * `listCard.borderWidth`.
 */
export function catalogRowTotalHeight(fontScale = 1): number {
  return catalogRowHeight(fontScale) + 2;
}

/**
 * What `getItemLayout` reports for a group header: the label row plus the gap
 * above it. Groups are separated by this header's own height — `listCardLast`
 * deliberately carries no bottom margin, since margin is height `getItemLayout`
 * cannot see.
 */
export function catalogSectionHeaderHeight(fontScale = 1): number {
  const label = 18;
  const gap = CATALOG_SECTION_HEADER_BASE_HEIGHT - label;
  return Math.round(gap + label * clampFontScale(fontScale));
}

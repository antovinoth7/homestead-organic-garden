/**
 * Catalog list metrics, kept free of any `react-native` import so both the
 * stylesheet and the pure list-building util can read them — and so the util
 * stays testable without the RN transform.
 *
 * These are a contract with `getItemLayout` on the catalog browse list: the
 * numbers here must match what `managePlantCatalogStyles` actually renders, or
 * the list mis-measures and scrolling leaves gaps.
 */

/**
 * Inner browse-row height: a 36px thumb plus 10px of padding top and bottom,
 * plus the subtitle line beneath the name. Fixed rather than intrinsic, so a
 * plant with no subtitle occupies exactly the same height as one with it.
 */
export const CATALOG_ROW_HEIGHT = 68;

/**
 * What `getItemLayout` reports for a plant row: the inner row plus the 1px top
 * and bottom border `listCard` draws around it. `rowDivider` is positioned
 * absolutely so it contributes nothing. Keep this in step with
 * `listCard.borderWidth`.
 */
export const CATALOG_ROW_TOTAL_HEIGHT = CATALOG_ROW_HEIGHT + 2;

/**
 * What `getItemLayout` reports for an A–Z letter header: the label row plus the
 * gap above it. Letter groups are separated by this header's own height —
 * `listCardLast` deliberately carries no bottom margin, since margin is height
 * `getItemLayout` cannot see.
 */
export const CATALOG_SECTION_HEADER_HEIGHT = 40;

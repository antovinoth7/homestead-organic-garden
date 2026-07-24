/**
 * Client-side windowing for long lists rendered inside a non-virtualized
 * parent ScrollView, where a FlatList cannot virtualize anyway.
 */

export interface ListPage<T> {
  visible: T[];
  /** Items beyond the current window. */
  remaining: number;
  /** True once the window has grown past its initial size. */
  canCollapse: boolean;
}

/**
 * Windows a list for progressive disclosure. `visible` is always a prefix
 * slice, so an item's index in `visible` matches its index in `items` — callers
 * can hand the full array to an index-based viewer while rendering only the
 * window.
 */
export function paginateList<T>(
  items: T[],
  visibleCount: number,
  initialCount: number
): ListPage<T> {
  const visible = items.slice(0, Math.max(0, visibleCount));
  return {
    visible,
    remaining: Math.max(0, items.length - visible.length),
    canCollapse: visible.length > initialCount,
  };
}

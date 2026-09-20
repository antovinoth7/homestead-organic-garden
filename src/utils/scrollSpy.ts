export interface SectionOffset<K extends string> {
  key: K;
  y: number;
}

/**
 * Given the measured top offsets of stacked sections in a scroll view, the
 * current scroll position and the height of the sticky bar pinned at the top,
 * returns the key of the section currently sitting just under the bar.
 *
 * A section is "active" once its adjusted top (`y - barHeight`) has scrolled
 * past the current position; the last such section wins. Offsets need not be
 * pre-sorted. Returns null only when there are no sections.
 *
 * `atEnd` marks the scroll view as bottomed out. Trailing sections are often
 * too short to ever reach the sticky bar — the scroll view clamps at
 * `contentHeight - viewportHeight` — so once the user can scroll no further the
 * last section wins outright. Without this they could never become active.
 */
export function activeSectionKey<K extends string>(
  offsets: SectionOffset<K>[],
  scrollY: number,
  barHeight: number,
  atEnd = false
): K | null {
  if (offsets.length === 0) return null;

  const sorted = [...offsets].sort((a, b) => a.y - b.y);

  if (atEnd) return sorted[sorted.length - 1]!.key;

  let active = sorted[0]!;
  for (const offset of sorted) {
    // A section is reached once its top meets the bottom edge of the sticky bar.
    if (offset.y - barHeight <= scrollY) {
      active = offset;
    } else {
      break;
    }
  }
  return active.key;
}

export interface ItemExtent {
  x: number;
  width: number;
}

/**
 * Smallest horizontal scroll offset that brings `item` fully into view inside a
 * scroller, leaving `pad` of breathing room on the leading/trailing edge. Used
 * to keep the active pill of a scrollable tab bar visible.
 *
 * Scrolls only as far as needed — an item already in view returns the current
 * offset unchanged, so no scroll is triggered. The result is clamped to the
 * scrollable range. Returns `scrollX` until the viewport is measured.
 */
export function scrollIntoViewOffset(
  item: ItemExtent,
  scrollX: number,
  viewportWidth: number,
  contentWidth: number,
  pad = 16
): number {
  if (viewportWidth <= 0) return scrollX;

  const leadingEdge = item.x - pad;
  const trailingEdge = item.x + item.width + pad;

  let target = scrollX;
  if (leadingEdge < scrollX) {
    target = leadingEdge;
  } else if (trailingEdge > scrollX + viewportWidth) {
    target = trailingEdge - viewportWidth;
  }

  const maxOffset = Math.max(0, contentWidth - viewportWidth);
  return Math.min(Math.max(target, 0), maxOffset);
}

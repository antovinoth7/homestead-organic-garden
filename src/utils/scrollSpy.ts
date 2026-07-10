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
 */
export function activeSectionKey<K extends string>(
  offsets: SectionOffset<K>[],
  scrollY: number,
  barHeight: number
): K | null {
  if (offsets.length === 0) return null;

  const sorted = [...offsets].sort((a, b) => a.y - b.y);

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

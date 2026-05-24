/**
 * Computes the target index a dragged tile should land at, given the gesture's
 * horizontal translation and the tile's original index. Pure — safe to unit test
 * without loading any React Native modules.
 */
export function computeTargetIndex(
  startIndex: number,
  translationX: number,
  totalCount: number,
  step: number
): number {
  if (totalCount <= 0) return 0;
  const raw = Math.round(startIndex + translationX / step);
  return Math.max(0, Math.min(totalCount - 1, raw));
}

/**
 * SVG arc-path helper for donut/progress-ring rendering (Phase C).
 *
 * Extracted from the inline `describeArc` in `TodayScreen` so the progress
 * ring can move into `TodayProgressCard` and be unit-tested. Angles are in
 * degrees, 0° at 12 o'clock, sweeping clockwise.
 */

/** Geometry constants for the Today progress donut. */
export const DONUT_SIZE = 140;
export const DONUT_STROKE = 14;
export const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
export const DONUT_CENTER = DONUT_SIZE / 2;

/**
 * Build an SVG arc path for a donut segment between two angles (degrees).
 * Arcs are clamped just under a full circle to avoid the SVG full-circle
 * rendering ambiguity.
 */
export function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const clampedEnd = Math.min(endAngle, startAngle + 359.99);
  const startRad = ((clampedEnd - 90) * Math.PI) / 180;
  const endRad = ((startAngle - 90) * Math.PI) / 180;
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;
  const x1 = cx + r * Math.cos(endRad);
  const y1 = cy + r * Math.sin(endRad);
  const x2 = cx + r * Math.cos(startRad);
  const y2 = cy + r * Math.sin(startRad);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

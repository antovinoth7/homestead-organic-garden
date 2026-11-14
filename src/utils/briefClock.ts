/**
 * Brief clock — the two times the Today screen derives from, held so they only
 * change when what they are used for has changed.
 *
 * The tab stays mounted for as long as the process lives, so anything that reads
 * `new Date()` once inside a memo is frozen at whatever day the app was opened
 * on. These keep the previous value until it has actually gone out of date,
 * which is what lets a `setState` with the result bail out on every ordinary
 * refocus instead of re-deriving the whole brief.
 *
 * Pure — no React Native — so it is directly unit-testable.
 */

/** How long a weather staleness reading is trusted before it is taken again. */
export const STALE_RECHECK_MS = 15 * 60 * 1000;

/**
 * `now` once the calendar day has turned over, else `prev` itself. Device-local,
 * matching the date label and season progress that are derived from it.
 */
export function advanceDay(prev: Date, now: Date): Date {
  const sameDay =
    prev.getFullYear() === now.getFullYear() &&
    prev.getMonth() === now.getMonth() &&
    prev.getDate() === now.getDate();
  return sameDay ? prev : now;
}

/**
 * `now` once the last reading is at least `STALE_RECHECK_MS` old, else `prev`.
 * A clock that moved backwards is taken as-is rather than waited out.
 */
export function advanceStaleCheck(prev: number, now: number): number {
  return now < prev || now - prev >= STALE_RECHECK_MS ? now : prev;
}

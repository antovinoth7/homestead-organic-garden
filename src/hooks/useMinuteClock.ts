import { useEffect, useState } from 'react';

const MINUTE_MS = 60_000;

/**
 * `compute(now)`, re-evaluated on each minute boundary while `active`. The
 * state only changes when the computed value does (compared with `Object.is`),
 * so a caller deriving something coarse — the current time band — re-renders
 * when that changes, not every minute. Inactive (an unfocused tab), it stops
 * ticking and catches up on reactivation.
 *
 * `compute` must be stable (a module-level function), or the clock restarts on
 * every render.
 */
export function useMinuteValue<T>(active: boolean, compute: (now: Date) => T): T {
  const [value, setValue] = useState(() => compute(new Date()));

  useEffect(() => {
    if (!active) return undefined;
    const update = (): void => setValue(compute(new Date()));
    update(); // catch up after a pause
    let interval: ReturnType<typeof setInterval> | null = null;
    const toNextMinute = MINUTE_MS - (Date.now() % MINUTE_MS);
    const timeout = setTimeout(() => {
      update();
      interval = setInterval(update, MINUTE_MS);
    }, toNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval !== null) clearInterval(interval);
    };
  }, [active, compute]);

  return value;
}

const currentDate = (now: Date): Date => now;

/**
 * The current time, refreshed on each minute boundary while `active` — enough
 * for a "NOW · 6:23" marker without re-rendering a screen every second. Every
 * tick is a new `Date`, so this re-renders its caller once a minute; prefer
 * `useMinuteValue` with a coarser `compute` when only part of the time matters.
 */
export function useMinuteClock(active: boolean): Date {
  return useMinuteValue(active, currentDate);
}

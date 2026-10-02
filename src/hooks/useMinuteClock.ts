import { useEffect, useState } from 'react';

const MINUTE_MS = 60_000;

/**
 * The current time, refreshed on each minute boundary while `active` — enough
 * for a "NOW · 6:23" marker without re-rendering a screen every second.
 * Inactive (an unfocused tab), it stops ticking and catches up on reactivation.
 */
export function useMinuteClock(active: boolean): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!active) return undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- catch up after a pause
    setNow(new Date());
    let interval: ReturnType<typeof setInterval> | null = null;
    const toNextMinute = MINUTE_MS - (Date.now() % MINUTE_MS);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), MINUTE_MS);
    }, toNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval !== null) clearInterval(interval);
    };
  }, [active]);

  return now;
}

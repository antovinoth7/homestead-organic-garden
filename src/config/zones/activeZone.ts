import { AgroClimaticZone } from './types';

/**
 * The farm's resolved agro-climatic zone, held synchronously.
 *
 * Zone resolution needs the saved farm config, which is only reachable through
 * an async read. But the callers that need a zone most — `getWateringFrequencyMultiplier`
 * and everything derived from it (`getEffectiveWateringIntervalDays`,
 * `getPlantWaterStatus`, `buildTaskDoneOps`) — are synchronous and sit deep
 * inside pure utilities, so threading a zone argument down to them would ripple
 * through Today, the bed cards, and alerts.
 *
 * Instead the zone is resolved once at startup and stored here. Unprimed it
 * returns null and callers keep their existing `DEFAULT_ZONE` fallback, so a
 * missed prime degrades to the previous behaviour rather than to nothing.
 */
let activeZone: AgroClimaticZone | null = null;

export function setActiveZone(zone: AgroClimaticZone | null): void {
  activeZone = zone;
}

export function getActiveZone(): AgroClimaticZone | null {
  return activeZone;
}

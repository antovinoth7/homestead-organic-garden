/**
 * Farm alert service (Phase C, C.10).
 *
 * Alert generation is pure (no Firestore) — inputs are already-loaded plants
 * and precomputed bed rotation data, so the logic lives in `alertsLogic.ts`
 * (unit-tested) and is re-exported here for screens/hooks, mirroring the
 * `beds.ts` ↔ `bedLogic.ts` split.
 */

export {
  getFarmAlerts,
  sortAlerts,
  isActionable,
  getTopAlert,
} from '@/services/alertsLogic';
export type { FarmAlertInputs } from '@/services/alertsLogic';

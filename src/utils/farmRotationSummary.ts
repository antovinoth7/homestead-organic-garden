import type { BedWithCoverage } from '@/hooks/useBedData';
import type { RotationStatus } from '@/types/database.types';
import { bedExpectsLegumes } from '@/config/beds';

export interface FarmRotationSummary {
  rulesPassed: number;
  rulesTotal: number;
  bedCount: number;
  /** Average legume coverage across legume-relevant beds, or null if there are none. */
  legumePct: number | null;
  legumeBedCount: number;
}

/**
 * Pure farm-wide rollup of the per-bed rotation statuses. Aggregates how many
 * rotation rules pass across every bed, and the average legume coverage over
 * only the bed types that are designed around legumes (mirrors TodayScreen).
 */
export function computeFarmRotationSummary(
  beds: BedWithCoverage[],
  statuses: RotationStatus[]
): FarmRotationSummary {
  let rulesPassed = 0;
  let rulesTotal = 0;
  for (const status of statuses) {
    for (const rule of status.coordinator_checklist) {
      rulesTotal += 1;
      if (rule.passed) rulesPassed += 1;
    }
  }

  const legumeBeds = beds.filter((b) => bedExpectsLegumes(b.type));
  const legumePct =
    legumeBeds.length > 0
      ? Math.round(
          legumeBeds.reduce((sum, b) => sum + b.legume_coverage_pct, 0) / legumeBeds.length
        )
      : null;

  return {
    rulesPassed,
    rulesTotal,
    bedCount: statuses.length,
    legumePct,
    legumeBedCount: legumeBeds.length,
  };
}

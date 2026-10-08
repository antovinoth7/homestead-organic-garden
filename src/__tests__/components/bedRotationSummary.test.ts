import { computeFarmRotationSummary } from '@/utils/farmRotationSummary';
import type { BedWithCoverage } from '@/hooks/useBedData';
import type { Bed, BedType, RotationRule, RotationStatus } from '@/types/database.types';

function makeBed(type: BedType, legumePct: number): BedWithCoverage {
  const base: Bed = {
    id: `bed-${type}-${legumePct}`,
    user_id: 'u1',
    name: `Bed ${type}`,
    type,
    dimensions: { width_m: 1.2, length_m: 3.0, area_sqm: 3.6 },
    sunlight: 'full_sun',
    soil_type: 'garden_soil',
    slope: 'flat',
    wind: 'moderate',
    pest_history: [],
    is_raised_bed: true,
    is_permanent: false,
    is_deleted: false,
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
  };
  return {
    ...base,
    legume_coverage_pct: legumePct,
    plant_count: 4,
    active_plant_count: 4,
    water_overdue: false,
  };
}

function rule(id: string, passed: boolean): RotationRule {
  return { id, rule: id, passed, description: '' };
}

function makeStatus(bedId: string, rules: RotationRule[]): RotationStatus {
  return {
    bed_id: bedId,
    has_solanaceae_violation: false,
    legume_coverage_pct: 0,
    harvest_gap_warnings: [],
    coordinator_checklist: rules,
    green_manure_recommendation: null,
  };
}

describe('computeFarmRotationSummary', () => {
  it('aggregates passed/total rules across all bed statuses', () => {
    const beds = [makeBed('leafy', 0), makeBed('root_legume', 50)];
    const statuses = [
      makeStatus(beds[0]!.id, [rule('a', true), rule('b', false), rule('c', true)]),
      makeStatus(beds[1]!.id, [rule('a', true), rule('b', true)]),
    ];

    const summary = computeFarmRotationSummary(beds, statuses);

    expect(summary.rulesTotal).toBe(5);
    expect(summary.rulesPassed).toBe(4);
    expect(summary.bedCount).toBe(2);
  });

  it('averages legume coverage only over legume-relevant bed types', () => {
    const beds = [
      makeBed('leafy', 0), // excluded — not legume-relevant
      makeBed('root_legume', 60),
      makeBed('three_sisters', 40),
    ];
    const statuses = beds.map((b) => makeStatus(b.id, []));

    const summary = computeFarmRotationSummary(beds, statuses);

    // (60 + 40) / 2 = 50; leafy is not counted
    expect(summary.legumePct).toBe(50);
    expect(summary.legumeBedCount).toBe(2);
  });

  it('returns null legumePct when no legume-relevant beds exist', () => {
    const beds = [makeBed('leafy', 0), makeBed('fruiting', 0), makeBed('spice', 0)];
    const statuses = beds.map((b) => makeStatus(b.id, []));

    const summary = computeFarmRotationSummary(beds, statuses);

    expect(summary.legumePct).toBeNull();
    expect(summary.legumeBedCount).toBe(0);
  });

  it('handles empty beds and statuses', () => {
    const summary = computeFarmRotationSummary([], []);
    expect(summary).toEqual({
      rulesPassed: 0,
      rulesTotal: 0,
      bedCount: 0,
      legumePct: null,
      legumeBedCount: 0,
    });
  });
});

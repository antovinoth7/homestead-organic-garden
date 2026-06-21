import {
  getBedStatus,
  primaryAttention,
  ATTENTION_LABEL,
  WATER_OVERDUE_DAYS,
  type BedAttentionReason,
} from '@/utils/bedStatus';
import type { BedWithCoverage } from '@/hooks/useBedData';

const NOW = Date.parse('2026-06-13T12:00:00.000Z');
const DAY = 1000 * 60 * 60 * 24;
const daysAgo = (n: number): string => new Date(NOW - n * DAY).toISOString();
const daysAhead = (n: number): string => new Date(NOW + n * DAY).toISOString();

function makeBed(overrides: Partial<BedWithCoverage> = {}): BedWithCoverage {
  const base: BedWithCoverage = {
    id: 'b1',
    user_id: 'u1',
    name: 'Bed 1',
    type: 'leafy',
    dimensions: { width_m: 1, length_m: 2, area_sqm: 2 },
    sunlight: 'full_sun',
    soil_type: 'garden_soil',
    slope: 'flat',
    wind: 'sheltered',
    pest_history: [],
    is_raised_bed: false,
    is_permanent: false,
    is_resting: false,
    resting_until: null,
    last_water_date: daysAgo(1),
    last_jeevamrutha_date: null,
    last_weeding_date: null,
    is_deleted: false,
    created_at: daysAgo(30),
    updated_at: daysAgo(1),
    legume_coverage_pct: 0,
    plant_count: 3,
    active_plant_count: 3,
    water_overdue: false,
  };
  return { ...base, ...overrides };
}

describe('getBedStatus — lifecycle', () => {
  it('classifies a planted bed as growing', () => {
    expect(getBedStatus(makeBed(), NOW).lifecycle).toBe('growing');
  });

  it('classifies a bed with no active plants as empty', () => {
    expect(getBedStatus(makeBed({ active_plant_count: 0 }), NOW).lifecycle).toBe('empty');
  });

  it('classifies a resting bed as resting with days remaining', () => {
    const s = getBedStatus(makeBed({ is_resting: true, resting_until: daysAhead(10) }), NOW);
    expect(s.lifecycle).toBe('resting');
    expect(s.restDaysRemaining).toBe(10);
    expect(s.restComplete).toBe(false);
  });

  it('marks resting complete (and flags it) once resting_until has passed', () => {
    const s = getBedStatus(makeBed({ is_resting: true, resting_until: daysAgo(2) }), NOW);
    expect(s.lifecycle).toBe('resting');
    expect(s.restComplete).toBe(true);
    expect(s.restDaysRemaining).toBeNull();
    expect(s.attention).toContain('rest_complete');
  });

  it('prioritises permanent over resting and empty', () => {
    const s = getBedStatus(
      makeBed({ is_permanent: true, is_resting: true, active_plant_count: 0 }),
      NOW
    );
    expect(s.lifecycle).toBe('permanent');
  });
});

describe('getBedStatus — attention', () => {
  it('flags a solanaceae rotation violation on a non-permanent bed', () => {
    expect(getBedStatus(makeBed({ prev_crop_family: 'solanaceae' }), NOW).attention).toContain(
      'rotation_violation'
    );
  });

  it('does not flag rotation violation on a permanent bed', () => {
    const s = getBedStatus(makeBed({ is_permanent: true, prev_crop_family: 'solanaceae' }), NOW);
    expect(s.attention).not.toContain('rotation_violation');
  });

  it('flags overdue water when a plant needs water and the bed was not manually watered', () => {
    const s = getBedStatus(makeBed({ water_overdue: true, last_water_date: null }), NOW);
    expect(s.attention).toContain('overdue_water');
  });

  it('does not flag overdue water when no plant needs water', () => {
    const s = getBedStatus(makeBed({ water_overdue: false, last_water_date: null }), NOW);
    expect(s.attention).not.toContain('overdue_water');
  });

  it('does not flag a never-manually-watered growing bed whose plants are all watered', () => {
    // Regression: previously a null last_water_date alone flagged the bed forever.
    const s = getBedStatus(makeBed({ water_overdue: false, last_water_date: null }), NOW);
    expect(s.attention).not.toContain('overdue_water');
  });

  it('lets a recent manual bed-level water log override plants needing water', () => {
    const s = getBedStatus(makeBed({ water_overdue: true, last_water_date: daysAgo(1) }), NOW);
    expect(s.attention).not.toContain('overdue_water');
  });

  it('flags again once the manual water log is older than the threshold', () => {
    const s = getBedStatus(
      makeBed({ water_overdue: true, last_water_date: daysAgo(WATER_OVERDUE_DAYS + 1) }),
      NOW
    );
    expect(s.attention).toContain('overdue_water');
  });

  it('does not flag overdue water on an empty bed even when plants would be overdue', () => {
    const s = getBedStatus(
      makeBed({ active_plant_count: 0, water_overdue: true, last_water_date: null }),
      NOW
    );
    expect(s.attention).not.toContain('overdue_water');
  });

  it('flags low legume coverage only for legume-relevant bed types', () => {
    const relevant = getBedStatus(
      makeBed({ type: 'root_legume', legume_coverage_pct: 10, plant_count: 4 }),
      NOW
    );
    expect(relevant.attention).toContain('low_legume');

    const irrelevant = getBedStatus(
      makeBed({ type: 'leafy', legume_coverage_pct: 10, plant_count: 4 }),
      NOW
    );
    expect(irrelevant.attention).not.toContain('low_legume');
  });

  it('does not flag low legume on an empty legume-relevant bed (plant_count === 0)', () => {
    const s = getBedStatus(
      makeBed({ type: 'root_legume', legume_coverage_pct: 0, plant_count: 0, active_plant_count: 0 }),
      NOW
    );
    expect(s.attention).not.toContain('low_legume');
  });

  it('reports no attention for a healthy growing bed', () => {
    expect(getBedStatus(makeBed(), NOW).attention).toEqual([]);
  });
});

describe('attention presentation', () => {
  const ALL_REASONS: BedAttentionReason[] = [
    'rotation_violation',
    'overdue_water',
    'rest_complete',
    'low_legume',
  ];

  it('has a non-empty label for every attention reason', () => {
    for (const reason of ALL_REASONS) {
      expect(ATTENTION_LABEL[reason]).toBeTruthy();
    }
  });

  it('returns null when nothing needs attention', () => {
    expect(primaryAttention([])).toBeNull();
  });

  it('prioritises urgent reasons over advisory ones regardless of order', () => {
    expect(primaryAttention(['low_legume', 'overdue_water'])).toBe('overdue_water');
    expect(primaryAttention(['rest_complete', 'rotation_violation'])).toBe('rotation_violation');
  });

  it('falls back to the first reason when none are urgent', () => {
    expect(primaryAttention(['rest_complete', 'low_legume'])).toBe('rest_complete');
  });
});

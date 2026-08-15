import {
  buildBedPreview,
  bedCardStatusLabel,
  MAX_PREVIEW_PINS,
} from '@/utils/bedPreview';
import type { BedStatus } from '@/utils/bedStatus';
import type { BedWithCoverage } from '@/hooks/useBedData';
import type { GrowthStage, Plant } from '@/types/database.types';
import { makePlant } from '../fixtures/plant.fixtures';

function makeStatus(overrides: Partial<BedStatus> = {}): BedStatus {
  return {
    lifecycle: 'growing',
    restDaysRemaining: null,
    restComplete: false,
    attention: [],
    ...overrides,
  };
}

function makeCoveredBed(overrides: Partial<BedWithCoverage> = {}): BedWithCoverage {
  return {
    id: 'b1',
    user_id: 'u1',
    name: 'Spice Corner',
    type: 'spice',
    dimensions: { width_m: 1, length_m: 2, area_sqm: 2 },
    sunlight: 'full_sun',
    soil_type: 'garden_soil',
    slope: 'flat',
    wind: 'sheltered',
    pest_history: [],
    is_raised_bed: false,
    is_permanent: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    legume_coverage_pct: 0,
    plant_count: 3,
    active_plant_count: 3,
    water_overdue: false,
    preview_plant_names: [],
    dominant_stage: null,
    ...overrides,
  };
}

describe('buildBedPreview — pins', () => {
  it('returns no pins for an empty bed', () => {
    expect(buildBedPreview([])).toEqual({ plantNames: [], dominantStage: null });
  });

  it('returns plant names for reference thumbnails', () => {
    const plants = [
      makePlant({ id: 'p1', name: 'Tomato', sort_order: 0 }),
      makePlant({ id: 'p2', name: 'Carrot', sort_order: 1 }),
    ];
    expect(buildBedPreview(plants).plantNames).toEqual(['Tomato', 'Carrot']);
  });

  it('keeps unknown plant names for the icon fallback path', () => {
    const plants = [makePlant({ id: 'p1', name: 'Zzyzx Bush', sort_order: 0 })];
    expect(buildBedPreview(plants).plantNames).toEqual(['Zzyzx Bush']);
  });

  it('keeps duplicate plant thumbnails', () => {
    const plants = [
      makePlant({ id: 'p1', name: 'Chilli', sort_order: 0 }),
      makePlant({ id: 'p2', name: 'Chilli', sort_order: 1 }),
      makePlant({ id: 'p3', name: 'Chilli', sort_order: 2 }),
    ];
    expect(buildBedPreview(plants).plantNames).toEqual(['Chilli', 'Chilli', 'Chilli']);
  });

  it(`caps the pins at MAX_PREVIEW_PINS (${MAX_PREVIEW_PINS})`, () => {
    const plants = Array.from({ length: 8 }, (_, i) =>
      makePlant({ id: `p${i}`, name: 'Tomato', sort_order: i })
    );
    expect(buildBedPreview(plants).plantNames).toHaveLength(MAX_PREVIEW_PINS);
  });

  it('orders by sort_order, sinking plants that have none', () => {
    const plants = [
      makePlant({ id: 'p1', name: 'Carrot', sort_order: null }),
      makePlant({ id: 'p2', name: 'Tomato', sort_order: 2 }),
      makePlant({ id: 'p3', name: 'Cucumber', sort_order: 1 }),
    ];
    expect(buildBedPreview(plants).plantNames).toEqual(['Cucumber', 'Tomato', 'Carrot']);
  });

  it('breaks equal sort_order ties by name so the row is stable', () => {
    const plants = [
      makePlant({ id: 'p1', name: 'Tomato', sort_order: 0 }),
      makePlant({ id: 'p2', name: 'Carrot', sort_order: 0 }),
    ];
    expect(buildBedPreview(plants).plantNames).toEqual(['Carrot', 'Tomato']);
  });

  it('does not mutate the caller-owned plant array', () => {
    const plants = [
      makePlant({ id: 'p1', name: 'Tomato', sort_order: 5 }),
      makePlant({ id: 'p2', name: 'Carrot', sort_order: 1 }),
    ];
    buildBedPreview(plants);
    expect(plants.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});

describe('buildBedPreview — dominant stage', () => {
  const staged = (id: string, stage: GrowthStage | null): Plant =>
    makePlant({ id, name: 'Tomato', growth_stage: stage });

  it('returns null when no plant has a recorded stage', () => {
    expect(buildBedPreview([staged('p1', null), staged('p2', null)]).dominantStage).toBeNull();
  });

  it('picks the stage held by the most plants', () => {
    const plants = [
      staged('p1', 'vegetative'),
      staged('p2', 'fruiting'),
      staged('p3', 'fruiting'),
    ];
    expect(buildBedPreview(plants).dominantStage).toBe('fruiting');
  });

  it('ignores plants with no stage when counting', () => {
    const plants = [staged('p1', null), staged('p2', null), staged('p3', 'flowering')];
    expect(buildBedPreview(plants).dominantStage).toBe('flowering');
  });

  it('prefers a pinned stage over the auto-progressed one', () => {
    const plants = [
      makePlant({
        id: 'p1',
        name: 'Tomato',
        growth_stage: 'vegetative',
        growth_stage_pinned: 'fruiting',
      }),
    ];
    expect(buildBedPreview(plants).dominantStage).toBe('fruiting');
  });

  it('breaks a tie towards the later stage', () => {
    const plants = [staged('p1', 'vegetative'), staged('p2', 'fruiting')];
    expect(buildBedPreview(plants).dominantStage).toBe('fruiting');
  });
});

describe('bedCardStatusLabel', () => {
  it('labels a growing bed by its lifecycle', () => {
    expect(bedCardStatusLabel(makeCoveredBed(), makeStatus(), 'vegetative')).toBe('Growing');
  });

  it('labels a mostly-fruiting growing bed as Fruiting', () => {
    expect(bedCardStatusLabel(makeCoveredBed(), makeStatus(), 'fruiting')).toBe('Fruiting');
  });

  it('lets an overdue watering outrank the fruiting badge', () => {
    const bed = makeCoveredBed({ water_overdue: true });
    expect(bedCardStatusLabel(bed, makeStatus(), 'fruiting')).toBe('Due water');
  });

  it('counts down a bed still resting', () => {
    const status = makeStatus({ lifecycle: 'resting', restDaysRemaining: 12 });
    expect(bedCardStatusLabel(makeCoveredBed(), status, null)).toBe('Resting · 12d');
  });

  it('flags a rest period that has elapsed', () => {
    const status = makeStatus({ lifecycle: 'resting', restComplete: true });
    expect(bedCardStatusLabel(makeCoveredBed(), status, null)).toBe('Rest done');
  });

  it('never calls a resting bed fruiting', () => {
    const status = makeStatus({ lifecycle: 'resting', restDaysRemaining: 3 });
    expect(bedCardStatusLabel(makeCoveredBed(), status, 'fruiting')).toBe('Resting · 3d');
  });

  it('labels an empty bed as ready to plant', () => {
    const bed = makeCoveredBed({ active_plant_count: 0 });
    expect(bedCardStatusLabel(bed, makeStatus({ lifecycle: 'empty' }), null)).toBe(
      'Ready to plant'
    );
  });

  it('labels a permanent bed as permanent', () => {
    const status = makeStatus({ lifecycle: 'permanent' });
    expect(bedCardStatusLabel(makeCoveredBed(), status, 'fruiting')).toBe('Permanent');
  });
});

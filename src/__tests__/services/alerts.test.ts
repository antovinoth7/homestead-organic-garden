import {
  getFarmAlerts,
  sortAlerts,
  isActionable,
  getTopAlert,
  ALERT_COMPLETE_FIELD,
} from '@/services/alerts';
import type { FarmAlert } from '@/types/database.types';
import { makePlant } from '../fixtures/plant.fixtures';

// Water alerts derive from getPlantWaterStatus, which scales the interval by the
// live season multiplier. Pin it to 1.0 so these date-based assertions are
// deterministic regardless of when the suite runs. (jest hoists this above the
// imports above.)
jest.mock('@/utils/seasonHelpers', () => ({
  ...jest.requireActual('@/utils/seasonHelpers'),
  getWateringFrequencyMultiplier: jest.fn(() => 1),
}));

const NOW = new Date('2026-03-15T12:00:00.000Z').getTime();

// Pest alerts depend on the live season config; ignore them for deterministic
// assertions about plant-condition / bed alerts.
function withoutPest(alerts: FarmAlert[]): FarmAlert[] {
  return alerts.filter((a) => a.type !== 'pest_spotted');
}

describe('getFarmAlerts', () => {
  it('emits a critical alert for sick plants', () => {
    const alerts = withoutPest(
      getFarmAlerts({
        plants: [makePlant({ id: 'p1', name: 'Brinjal', health_status: 'sick' })],
        now: NOW,
      })
    );
    const sick = alerts.find((a) => a.type === 'health_sick');
    expect(sick).toMatchObject({ severity: 'critical', plantId: 'p1' });
  });

  it('flags overdue watering with severity scaled by lateness', () => {
    const plant = makePlant({
      id: 'p2',
      name: 'Okra',
      watering_frequency_days: 2,
      last_watered_date: '2026-03-05T08:00:00.000Z', // ~10 days ago
    });
    const alerts = getFarmAlerts({ plants: [plant], now: NOW });
    const water = alerts.find((a) => a.type === 'water_needed');
    expect(water).toBeDefined();
    expect(water?.severity).toBe('critical');
    expect(water?.daysOverdue).toBeGreaterThan(0);
  });

  it('flags harvest-ready plants', () => {
    const plant = makePlant({
      id: 'p3',
      name: 'Tomato',
      expected_harvest_date: '2026-03-10T00:00:00.000Z',
    });
    const alerts = getFarmAlerts({ plants: [plant], now: NOW });
    expect(alerts.some((a) => a.type === 'harvest_due' && a.plantId === 'p3')).toBe(true);
  });

  it('stops flagging harvest once the plant was harvested on/after the expected date', () => {
    const plant = makePlant({
      id: 'p3a',
      name: 'Tomato',
      expected_harvest_date: '2026-03-10T00:00:00.000Z',
      last_harvest_date: '2026-03-12T09:00:00.000Z',
    });
    const alerts = getFarmAlerts({ plants: [plant], now: NOW });
    expect(alerts.some((a) => a.type === 'harvest_due')).toBe(false);
  });

  it('stops flagging harvest when harvested exactly on the expected date', () => {
    const plant = makePlant({
      id: 'p3b',
      expected_harvest_date: '2026-03-10T00:00:00.000Z',
      last_harvest_date: '2026-03-10T18:00:00.000Z',
    });
    const alerts = getFarmAlerts({ plants: [plant], now: NOW });
    expect(alerts.some((a) => a.type === 'harvest_due')).toBe(false);
  });

  it('still flags harvest when the last harvest predates the expected date', () => {
    const plant = makePlant({
      id: 'p3c',
      expected_harvest_date: '2026-03-10T00:00:00.000Z',
      last_harvest_date: '2026-02-01T09:00:00.000Z',
    });
    const alerts = getFarmAlerts({ plants: [plant], now: NOW });
    expect(alerts.some((a) => a.type === 'harvest_due' && a.plantId === 'p3c')).toBe(true);
  });

  // Cut-and-come-again crops get no harvest care task of their own, so the
  // alert is the only thing that re-prompts the next picking.
  describe('cut-and-come-again re-arming', () => {
    const expected = '2026-01-10T00:00:00.000Z';

    it('re-alerts once a full picking cycle has passed since the last harvest', () => {
      const plant = makePlant({
        id: 'cc1',
        harvest_mode: 'cut_and_come_again',
        expected_harvest_date: expected,
        last_harvest_date: '2026-02-23T09:00:00.000Z', // 20 days before NOW
      });
      const alerts = getFarmAlerts({ plants: [plant], now: NOW });
      expect(alerts.some((a) => a.type === 'harvest_due' && a.plantId === 'cc1')).toBe(true);
    });

    it('re-alerts on the boundary day (interval is inclusive)', () => {
      const plant = makePlant({
        id: 'cc2',
        harvest_mode: 'cut_and_come_again',
        expected_harvest_date: expected,
        last_harvest_date: '2026-03-01T09:00:00.000Z', // exactly 14 days before NOW
      });
      const alerts = getFarmAlerts({ plants: [plant], now: NOW });
      expect(alerts.some((a) => a.type === 'harvest_due' && a.plantId === 'cc2')).toBe(true);
    });

    it('stays silent inside the picking cycle', () => {
      const plant = makePlant({
        id: 'cc3',
        harvest_mode: 'cut_and_come_again',
        expected_harvest_date: expected,
        last_harvest_date: '2026-03-12T09:00:00.000Z', // 3 days before NOW
      });
      const alerts = getFarmAlerts({ plants: [plant], now: NOW });
      expect(alerts.some((a) => a.type === 'harvest_due')).toBe(false);
    });

    it('measures daysOverdue from the expected date, not the last harvest', () => {
      const plant = makePlant({
        id: 'cc4',
        harvest_mode: 'cut_and_come_again',
        expected_harvest_date: expected, // 64 days before NOW
        last_harvest_date: '2026-02-23T09:00:00.000Z', // 20 days before NOW
      });
      const alerts = getFarmAlerts({ plants: [plant], now: NOW });
      const harvest = alerts.find((a) => a.type === 'harvest_due');
      expect(harvest?.daysOverdue).toBe(64);
    });

    it.each([
      ['one_shot' as const, 'os1'],
      [null, 'nm1'],
    ])('never re-alerts for harvest_mode %s', (mode, id) => {
      const plant = makePlant({
        id,
        harvest_mode: mode,
        expected_harvest_date: expected,
        last_harvest_date: '2026-01-14T09:00:00.000Z', // 60 days before NOW
      });
      const alerts = getFarmAlerts({ plants: [plant], now: NOW });
      expect(alerts.some((a) => a.type === 'harvest_due')).toBe(false);
    });
  });

  it('ignores archived plants entirely', () => {
    const alerts = withoutPest(
      getFarmAlerts({
        plants: [
          makePlant({
            id: 'p3d',
            name: 'Cleared Okra',
            health_status: 'sick',
            expected_harvest_date: '2026-01-10T00:00:00.000Z',
            watering_frequency_days: 2,
            last_watered_date: '2026-01-05T08:00:00.000Z',
            fertilising_frequency_days: 30,
            last_fertilised_date: null,
            planting_date: '2025-10-01T00:00:00.000Z',
            archived_at: '2026-02-01T00:00:00.000Z',
          }),
        ],
        emptyOrRestingBedCount: 0,
        now: NOW,
      })
    );
    expect(alerts).toHaveLength(0);
  });

  it('ignores soft-deleted plants', () => {
    const alerts = withoutPest(
      getFarmAlerts({
        plants: [makePlant({ id: 'p4', health_status: 'sick', is_deleted: true })],
        emptyOrRestingBedCount: 0,
        now: NOW,
      })
    );
    expect(alerts).toHaveLength(0);
  });

  it('flags a plant that has never been fertilised once older than its frequency', () => {
    const plant = makePlant({
      id: 'p5',
      name: 'Banana',
      fertilising_frequency_days: 30,
      planting_date: '2026-01-01T00:00:00.000Z', // 73 days before NOW
      last_fertilised_date: null,
    });
    const alerts = getFarmAlerts({ plants: [plant], now: NOW });
    const fert = alerts.find((a) => a.type === 'fertilise_due');
    expect(fert).toMatchObject({
      plantId: 'p5',
      severity: 'warning',
      message: 'First fertilising due — no manure logged yet',
    });
    expect(fert?.daysOverdue).toBeGreaterThan(0);
  });

  it('does not flag a never-fertilised plant younger than its frequency', () => {
    const plant = makePlant({
      id: 'p6',
      fertilising_frequency_days: 90, // older than 73-day plant age
      planting_date: '2026-01-01T00:00:00.000Z',
      last_fertilised_date: null,
    });
    const alerts = getFarmAlerts({ plants: [plant], now: NOW });
    expect(alerts.some((a) => a.type === 'fertilise_due')).toBe(false);
  });

  it('emits one actionable water alert per due plant (badge count is truthful)', () => {
    // Several plants all watered exactly their frequency ago → each is due today.
    const dueDate = '2026-03-13T08:00:00.000Z'; // 2 days before NOW
    const plants = ['Mahogany VVP 01', 'Mahogany VVP 02', 'Teak VVP 01', 'Neem VVP 01'].map(
      (name, i) =>
        makePlant({
          id: `p${i}`,
          name,
          watering_frequency_days: 2,
          last_watered_date: dueDate,
        })
    );

    const actionable = getFarmAlerts({ plants, now: NOW }).filter(isActionable);
    const waterAlerts = actionable.filter((a) => a.type === 'water_needed');

    // One water alert per plant, none silently dropped, ids unique.
    expect(waterAlerts).toHaveLength(plants.length);
    expect(waterAlerts.every((a) => a.message === 'Watering due today')).toBe(true);
    expect(new Set(waterAlerts.map((a) => a.id)).size).toBe(plants.length);
  });

  it('emits rotation alerts from cross-bed status', () => {
    const alerts = getFarmAlerts({
      plants: [],
      rotationStatuses: [
        {
          bed_id: 'b1',
          has_solanaceae_violation: true,
          legume_coverage_pct: 10,
          harvest_gap_warnings: [],
          coordinator_checklist: [],
          green_manure_recommendation: null,
        },
      ],
      bedNames: { b1: 'North Bed' },
      now: NOW,
    });
    const rotation = alerts.find((a) => a.type === 'rotation_due');
    expect(rotation).toMatchObject({ severity: 'critical', bedId: 'b1', title: 'North Bed' });
  });

  describe('farm-level green-manure alert', () => {
    it('emits a single actionable card naming the empty-bed count', () => {
      const alerts = getFarmAlerts({ plants: [], emptyOrRestingBedCount: 2, now: NOW });
      const gm = alerts.filter((a) => a.type === 'bed_resting_end');
      expect(gm).toHaveLength(1);
      expect(gm[0]).toMatchObject({ severity: 'info', title: 'Green manure' });
      expect(gm[0]!.bedId).toBeUndefined();
      expect(gm[0]!.message).toContain('in 2 empty beds');
      expect(isActionable(gm[0]!)).toBe(true);
    });

    it('uses generic wording while the bed count is unknown (still shows)', () => {
      const loading = getFarmAlerts({ plants: [], emptyOrRestingBedCount: null, now: NOW });
      const omitted = getFarmAlerts({ plants: [], now: NOW });
      for (const alerts of [loading, omitted]) {
        const gm = alerts.find((a) => a.type === 'bed_resting_end');
        expect(gm?.message).toContain('green manure in empty beds');
      }
    });

    it('completes (no card) once every bed is planted', () => {
      const alerts = getFarmAlerts({ plants: [], emptyOrRestingBedCount: 0, now: NOW });
      expect(alerts.some((a) => a.type === 'bed_resting_end')).toBe(false);
    });
  });
});

describe('sortAlerts', () => {
  it('orders critical before warning before info', () => {
    const base = { icon: '', message: '', created_at: '', daysOverdue: 0 };
    const alerts: FarmAlert[] = [
      { ...base, id: '1', type: 'pest_spotted', title: 'c', severity: 'info' },
      { ...base, id: '2', type: 'water_needed', title: 'b', severity: 'critical' },
      { ...base, id: '3', type: 'harvest_due', title: 'a', severity: 'warning' },
    ];
    expect(sortAlerts(alerts).map((a) => a.severity)).toEqual(['critical', 'warning', 'info']);
  });
});

describe('isActionable', () => {
  it('includes core action types and excludes pest/stress info', () => {
    const base = { id: 'x', icon: '', title: '', message: '', created_at: '', daysOverdue: 0 };
    expect(isActionable({ ...base, type: 'water_needed', severity: 'warning' })).toBe(true);
    expect(isActionable({ ...base, type: 'harvest_due', severity: 'warning' })).toBe(true);
    expect(isActionable({ ...base, type: 'pest_spotted', severity: 'info' })).toBe(false);
    expect(isActionable({ ...base, type: 'health_stressed', severity: 'warning' })).toBe(false);
  });
});

describe('ALERT_COMPLETE_FIELD', () => {
  it('maps exactly the one-tap-completable alert types to their plant date field', () => {
    expect(ALERT_COMPLETE_FIELD).toEqual({
      fertilise_due: 'last_fertilised_date',
      harvest_due: 'last_harvest_date',
    });
  });

  it('covers only actionable alert types', () => {
    const base = { id: 'x', icon: '', title: '', message: '', created_at: '', daysOverdue: 0 };
    for (const type of Object.keys(ALERT_COMPLETE_FIELD) as FarmAlert['type'][]) {
      expect(isActionable({ ...base, type, severity: 'warning' })).toBe(true);
    }
  });
});

describe('getTopAlert', () => {
  it('returns null for no alerts and the most urgent otherwise', () => {
    expect(getTopAlert([])).toBeNull();
    const top = getTopAlert(
      getFarmAlerts({ plants: [makePlant({ health_status: 'sick' })], now: NOW })
    );
    expect(top?.severity).toBe('critical');
  });
});

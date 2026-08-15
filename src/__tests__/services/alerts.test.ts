import {
  getFarmAlerts,
  sortAlerts,
  isActionable,
  getTopAlert,
  ALERT_COMPLETE_FIELD,
  ATTENTION_MIN_DAYS_OVERDUE,
} from '@/services/alerts';
import type { FarmAlert } from '@/types/database.types';
import { summarizeTodayTasks } from '@/utils/taskSummary';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

const NOW = new Date('2026-03-15T12:00:00.000Z').getTime();

/** ISO timestamp `days` before NOW, at the app's 6 PM due-time convention. */
function dueDaysAgo(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  d.setHours(18, 0, 0, 0);
  return d.toISOString();
}

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

  // Care alerts are a presentation of the task schedule, not a second one.
  describe('care alerts come from task templates', () => {
    it('emits nothing for care when no tasks are passed', () => {
      const plant = makePlant({
        id: 'p2',
        watering_frequency_days: 2,
        last_watered_date: '2026-03-01T08:00:00.000Z',
        fertilising_frequency_days: 30,
        last_fertilised_date: null,
        planting_date: '2025-01-01T00:00:00.000Z',
      });
      const alerts = withoutPest(getFarmAlerts({ plants: [plant], now: NOW }));
      expect(alerts.some((a) => a.type === 'water_needed')).toBe(false);
      expect(alerts.some((a) => a.type === 'fertilise_due')).toBe(false);
    });

    it('maps each care task type to its alert type, carrying the template id', () => {
      const plant = makePlant({ id: 'p2', name: 'Okra' });
      const alerts = getFarmAlerts({
        plants: [plant],
        todayTasks: [
          makeTaskTemplate({ id: 't-w', plant_id: 'p2', task_type: 'water', next_due_at: dueDaysAgo(3) }),
          makeTaskTemplate({ id: 't-f', plant_id: 'p2', task_type: 'fertilise', next_due_at: dueDaysAgo(3) }),
          makeTaskTemplate({ id: 't-p', plant_id: 'p2', task_type: 'prune', next_due_at: dueDaysAgo(3) }),
        ],
        now: NOW,
      });

      expect(alerts.find((a) => a.type === 'water_needed')).toMatchObject({
        templateId: 't-w',
        plantId: 'p2',
        title: 'Okra',
      });
      expect(alerts.find((a) => a.type === 'fertilise_due')?.templateId).toBe('t-f');
      // Pruning had no alert at all before the schedule became the source.
      expect(alerts.find((a) => a.type === 'prune_due')?.templateId).toBe('t-p');
    });

    it('counts daysOverdue in whole calendar days and scales severity by lateness', () => {
      const plant = makePlant({ id: 'p2' });
      const build = (daysLate: number): FarmAlert | undefined =>
        getFarmAlerts({
          plants: [plant],
          todayTasks: [
            makeTaskTemplate({
              id: 't',
              plant_id: 'p2',
              task_type: 'water',
              frequency_days: 6,
              next_due_at: dueDaysAgo(daysLate),
            }),
          ],
          now: NOW,
        }).find((a) => a.type === 'water_needed');

      expect(build(2)).toMatchObject({ daysOverdue: 2, severity: 'warning' });
      expect(build(2)?.message).toBe('Watering overdue by 2 days');
      // Half a 6-day cycle late → critical.
      expect(build(3)).toMatchObject({ daysOverdue: 3, severity: 'critical' });
    });

    it('ignores work that is merely due today — that is the ring’s job', () => {
      const alerts = getFarmAlerts({
        plants: [makePlant({ id: 'p2' })],
        todayTasks: [
          makeTaskTemplate({ id: 't', plant_id: 'p2', task_type: 'water', next_due_at: dueDaysAgo(0) }),
        ],
        now: NOW,
      });
      expect(alerts.some((a) => a.type === 'water_needed')).toBe(false);
      expect(ATTENTION_MIN_DAYS_OVERDUE).toBe(1);
    });

    it('ignores disabled templates — a care type switched off cannot keep firing', () => {
      // Regression: alerts used to re-derive fertilising from plant fields and so
      // ignored `fertilising_enabled`, outliving the task the Care Plan dropped.
      const plant = makePlant({
        id: 'p2',
        fertilising_enabled: false,
        fertilising_frequency_days: 30,
        last_fertilised_date: '2025-06-01T00:00:00.000Z',
      });
      const alerts = getFarmAlerts({
        plants: [plant],
        todayTasks: [
          makeTaskTemplate({
            id: 't',
            plant_id: 'p2',
            task_type: 'fertilise',
            enabled: false,
            next_due_at: dueDaysAgo(40),
          }),
        ],
        now: NOW,
      });
      expect(alerts.some((a) => a.type === 'fertilise_due')).toBe(false);
    });

    it('drops templates whose plant is archived or deleted', () => {
      const alerts = withoutPest(
        getFarmAlerts({
          plants: [
            makePlant({ id: 'gone', archived_at: '2026-02-01T00:00:00.000Z' }),
            makePlant({ id: 'dead', is_deleted: true }),
          ],
          todayTasks: [
            makeTaskTemplate({ id: 't1', plant_id: 'gone', next_due_at: dueDaysAgo(9) }),
            makeTaskTemplate({ id: 't2', plant_id: 'dead', next_due_at: dueDaysAgo(9) }),
            makeTaskTemplate({ id: 't3', plant_id: 'unknown', next_due_at: dueDaysAgo(9) }),
          ],
          emptyOrRestingBedCount: 0,
          now: NOW,
        })
      );
      expect(alerts).toHaveLength(0);
    });

    it('titles bed-scoped tasks with the bed name', () => {
      const alerts = getFarmAlerts({
        plants: [],
        todayTasks: [
          makeTaskTemplate({
            id: 't',
            plant_id: null,
            bed_id: 'b1',
            task_type: 'water',
            next_due_at: dueDaysAgo(4),
          }),
        ],
        bedNames: { b1: 'North Bed' },
        now: NOW,
      });
      expect(alerts.find((a) => a.type === 'water_needed')).toMatchObject({
        title: 'North Bed',
        bedId: 'b1',
      });
    });

    it('leaves task types with no alert shape to the ring and the Care Plan', () => {
      const alerts = withoutPest(
        getFarmAlerts({
          plants: [makePlant({ id: 'p2' })],
          todayTasks: [
            makeTaskTemplate({ id: 't', plant_id: 'p2', task_type: 'spray', next_due_at: dueDaysAgo(9) }),
          ],
          emptyOrRestingBedCount: 0,
          now: NOW,
        })
      );
      expect(alerts).toHaveLength(0);
    });

    // The whole point of the unification: one input set, one count.
    it('never reports more overdue care than the plot counts do', () => {
      const plants = ['Pepper 01', 'Pepper 02', 'Pepper 03'].map((name, i) =>
        makePlant({ id: `p${i}`, name })
      );
      const todayTasks = [
        makeTaskTemplate({ id: 'a', plant_id: 'p0', task_type: 'water', next_due_at: dueDaysAgo(4) }),
        makeTaskTemplate({ id: 'b', plant_id: 'p1', task_type: 'fertilise', next_due_at: dueDaysAgo(2) }),
        makeTaskTemplate({ id: 'c', plant_id: 'p2', task_type: 'prune', next_due_at: dueDaysAgo(1) }),
        makeTaskTemplate({ id: 'd', plant_id: 'p2', task_type: 'water', next_due_at: dueDaysAgo(0) }),
      ];

      const careAlerts = getFarmAlerts({ plants, todayTasks, now: NOW }).filter(
        (a) => a.templateId != null
      );
      const summary = summarizeTodayTasks(todayTasks, [], NOW);

      expect(careAlerts).toHaveLength(summary.overdueCount);
      expect(new Set(careAlerts.map((a) => a.id)).size).toBe(careAlerts.length);
    });
  });

  describe('harvest readiness (no task behind it)', () => {
    it('flags harvest-ready plants', () => {
      const plant = makePlant({
        id: 'p3',
        name: 'Tomato',
        expected_harvest_date: '2026-03-10T00:00:00.000Z',
      });
      const alerts = getFarmAlerts({ plants: [plant], now: NOW });
      expect(alerts.some((a) => a.type === 'harvest_due' && a.plantId === 'p3')).toBe(true);
    });

    it('defers to the harvest task when the plant has one', () => {
      // Coconuts and perennials get a real harvest template; without this guard
      // they would be reported twice, once by each path.
      const plant = makePlant({
        id: 'p3e',
        expected_harvest_date: '2026-03-10T00:00:00.000Z',
      });
      const alerts = getFarmAlerts({
        plants: [plant],
        todayTasks: [
          makeTaskTemplate({
            id: 't-h',
            plant_id: 'p3e',
            task_type: 'harvest_leaves',
            next_due_at: dueDaysAgo(2),
          }),
        ],
        now: NOW,
      });
      const harvest = alerts.filter((a) => a.type === 'harvest_due');
      expect(harvest).toHaveLength(1);
      expect(harvest[0]!.templateId).toBe('t-h');
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
    // Nothing else on the Today screen states rotation risk, so it belongs in
    // the needs-action queue.
    expect(isActionable(rotation!)).toBe(true);
  });

  describe('farm-level green-manure alert', () => {
    it('emits a single card naming the empty-bed count', () => {
      const alerts = getFarmAlerts({ plants: [], emptyOrRestingBedCount: 2, now: NOW });
      const gm = alerts.filter((a) => a.type === 'bed_resting_end');
      expect(gm).toHaveLength(1);
      expect(gm[0]).toMatchObject({ severity: 'info', title: 'Green manure' });
      expect(gm[0]!.bedId).toBeUndefined();
      expect(gm[0]!.message).toContain('in 2 empty beds');
      // A seasonal suggestion, not something the farm has fallen behind on — it
      // renders under seasonal guidance instead.
      expect(isActionable(gm[0]!)).toBe(false);
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
    const base = {
      iconKey: 'general.warning' as const,
      message: '',
      created_at: '',
      daysOverdue: 0,
    };
    const alerts: FarmAlert[] = [
      { ...base, id: '1', type: 'pest_spotted', title: 'c', severity: 'info' },
      { ...base, id: '2', type: 'water_needed', title: 'b', severity: 'critical' },
      { ...base, id: '3', type: 'harvest_due', title: 'a', severity: 'warning' },
    ];
    expect(sortAlerts(alerts).map((a) => a.severity)).toEqual(['critical', 'warning', 'info']);
  });
});

describe('isActionable', () => {
  const base = {
    id: 'x',
    iconKey: 'general.warning' as const,
    title: '',
    message: '',
    created_at: '',
    daysOverdue: 0,
  };

  it('includes the conditions no count on the screen states', () => {
    expect(isActionable({ ...base, type: 'health_sick', severity: 'critical' })).toBe(true);
    expect(isActionable({ ...base, type: 'harvest_due', severity: 'warning' })).toBe(true);
    expect(isActionable({ ...base, type: 'rotation_due', severity: 'critical' })).toBe(true);
  });

  it('excludes anything a task already covers, whatever its type', () => {
    // The plot cards count scheduled work; a card for it here would be the same
    // fact twice, under counting rules that disagree.
    for (const type of ['water_needed', 'fertilise_due', 'prune_due', 'harvest_due'] as const) {
      expect(isActionable({ ...base, type, severity: 'warning', templateId: 't1' })).toBe(false);
    }
  });

  it('excludes the care types even with no template id, since they only arise from tasks', () => {
    for (const type of ['water_needed', 'fertilise_due', 'prune_due'] as const) {
      expect(isActionable({ ...base, type, severity: 'warning' })).toBe(false);
    }
  });

  it('excludes informational and advisory types', () => {
    // pest/stress are informational; green manure is advice, and renders as the
    // season block's closing line.
    for (const type of ['pest_spotted', 'health_stressed', 'bed_resting_end'] as const) {
      expect(isActionable({ ...base, type, severity: 'warning' })).toBe(false);
    }
  });

  it('separates the two harvest_due sources', () => {
    // Field-derived readiness has nothing to complete and belongs in the queue;
    // the same type built from an overdue harvest task does not.
    expect(isActionable({ ...base, type: 'harvest_due', severity: 'warning' })).toBe(true);
    expect(
      isActionable({ ...base, type: 'harvest_due', severity: 'warning', templateId: 't1' })
    ).toBe(false);
  });
});

describe('ALERT_COMPLETE_FIELD', () => {
  it('covers only the card kind that has no task to complete', () => {
    expect(ALERT_COMPLETE_FIELD).toEqual({ harvest_due: 'last_harvest_date' });
  });

  it('covers only actionable alert types', () => {
    const base = {
      id: 'x',
      iconKey: 'general.warning' as const,
      title: '',
      message: '',
      created_at: '',
      daysOverdue: 0,
    };
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

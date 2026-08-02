import { UNASSIGNED_PLOT_ID } from '../../types/database.types';
import {
  groupByPlot,
  matchesPlotFilter,
  PlotGroupInput,
  UNASSIGNED_PLOT_NAME,
} from '../../utils/plotGrouping';
import { makeBed } from '../fixtures/bed.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskLog, makeTaskTemplate } from '../fixtures/task.fixtures';
import { makeFarmAlert } from '../fixtures/today.fixtures';

function input(overrides: Partial<PlotGroupInput> = {}): PlotGroupInput {
  return {
    parentLocations: ['Home farm', 'Paddy land'],
    fallbackName: 'Kanyakumari',
    plants: [],
    beds: [],
    tasks: [],
    logs: [],
    alerts: [],
    ...overrides,
  };
}

type Groups = ReturnType<typeof groupByPlot>['groups'];

const findGroup = (groups: Groups, id: string): Groups[number] | undefined =>
  groups.find((g) => g.id === id);

describe('groupByPlot — plants', () => {
  it("uses the plant's own parent location", () => {
    const plant = makePlant({ id: 'p1', location: 'Paddy land - Bed 1' });
    const { groups } = groupByPlot(input({ plants: [plant] }));
    expect(findGroup(groups, 'Paddy land')?.plants.map((p) => p.id)).toEqual(['p1']);
  });

  it("falls back to the plant's bed when it has no location of its own", () => {
    const bed = makeBed({ id: 'b1', parent_location: 'Paddy land' });
    const plant = makePlant({ id: 'p1', location: '', bed_id: 'b1' });
    const { groups } = groupByPlot(input({ beds: [bed], plants: [plant] }));
    expect(findGroup(groups, 'Paddy land')?.plants.map((p) => p.id)).toEqual(['p1']);
  });

  it('places a plant with neither into the unassigned bucket', () => {
    const plant = makePlant({ id: 'p1', location: '' });
    const { groups } = groupByPlot(input({ plants: [plant] }));
    expect(findGroup(groups, UNASSIGNED_PLOT_ID)?.plants.map((p) => p.id)).toEqual(['p1']);
  });

  it('matches the configured plot regardless of case and whitespace', () => {
    const plant = makePlant({ id: 'p1', location: '  home FARM  - Bed 3' });
    const { groups } = groupByPlot(input({ plants: [plant] }));
    expect(findGroup(groups, 'Home farm')?.plants.map((p) => p.id)).toEqual(['p1']);
  });

  it('excludes soft-deleted plants from every bucket', () => {
    const plant = makePlant({ id: 'p1', location: 'Home farm', is_deleted: true });
    const { groups } = groupByPlot(input({ plants: [plant] }));
    expect(groups.flatMap((g) => g.plants)).toHaveLength(0);
  });
});

describe('groupByPlot — tasks and logs', () => {
  it("follows the task's plant", () => {
    const plant = makePlant({ id: 'p1', location: 'Paddy land' });
    const task = makeTaskTemplate({ id: 't1', plant_id: 'p1' });
    const { groups } = groupByPlot(input({ plants: [plant], tasks: [task] }));
    expect(findGroup(groups, 'Paddy land')?.tasks.map((t) => t.id)).toEqual(['t1']);
  });

  it("follows the task's bed when it has no plant", () => {
    const bed = makeBed({ id: 'b1', parent_location: 'Paddy land' });
    const task = makeTaskTemplate({ id: 't1', plant_id: null, bed_id: 'b1' });
    const { groups } = groupByPlot(input({ beds: [bed], tasks: [task] }));
    expect(findGroup(groups, 'Paddy land')?.tasks.map((t) => t.id)).toEqual(['t1']);
  });

  it('places a task with neither into the unassigned bucket', () => {
    const task = makeTaskTemplate({ id: 't1', plant_id: null, bed_id: null });
    const { groups } = groupByPlot(input({ tasks: [task] }));
    expect(findGroup(groups, UNASSIGNED_PLOT_ID)?.tasks.map((t) => t.id)).toEqual(['t1']);
  });

  it('routes logs by the same resolution as tasks', () => {
    const plant = makePlant({ id: 'p1', location: 'Home farm' });
    const log = makeTaskLog({ id: 'l1', plant_id: 'p1' });
    const { groups } = groupByPlot(input({ plants: [plant], logs: [log] }));
    expect(findGroup(groups, 'Home farm')?.logs.map((l) => l.id)).toEqual(['l1']);
  });

  it('exposes the same resolver it used', () => {
    const plant = makePlant({ id: 'p1', location: 'Paddy land' });
    const { resolveTaskPlotId } = groupByPlot(input({ plants: [plant] }));
    expect(resolveTaskPlotId({ plant_id: 'p1' })).toBe('Paddy land');
    expect(resolveTaskPlotId({ plant_id: null })).toBe(UNASSIGNED_PLOT_ID);
  });
});

describe('groupByPlot — alerts', () => {
  it('routes by plant, then bed, then to the unassigned bucket', () => {
    const plant = makePlant({ id: 'p1', location: 'Home farm' });
    const bed = makeBed({ id: 'b1', parent_location: 'Paddy land' });
    const byPlant = makeFarmAlert({ id: 'a1', plantId: 'p1' });
    const byBed = makeFarmAlert({ id: 'a2', bedId: 'b1' });
    const farmLevel = makeFarmAlert({ id: 'a3', type: 'bed_resting_end' });

    const { groups } = groupByPlot(
      input({ plants: [plant], beds: [bed], alerts: [byPlant, byBed, farmLevel] })
    );

    expect(findGroup(groups, 'Home farm')?.alerts.map((a) => a.id)).toEqual(['a1']);
    expect(findGroup(groups, 'Paddy land')?.alerts.map((a) => a.id)).toEqual(['a2']);
    expect(findGroup(groups, UNASSIGNED_PLOT_ID)?.alerts.map((a) => a.id)).toEqual(['a3']);
  });
});

describe('groupByPlot — bucket set and order', () => {
  it('keeps every configured plot even when empty, in configured order', () => {
    const { groups } = groupByPlot(input());
    expect(groups.map((g) => g.id)).toEqual(['Home farm', 'Paddy land']);
    expect(groups.every((g) => g.isConfigured)).toBe(true);
  });

  it('omits the unassigned bucket when nothing lands in it', () => {
    const plant = makePlant({ id: 'p1', location: 'Home farm' });
    const { groups } = groupByPlot(input({ plants: [plant] }));
    expect(findGroup(groups, UNASSIGNED_PLOT_ID)).toBeUndefined();
  });

  it('gives an unrecognised parent its own bucket rather than hiding it', () => {
    const plant = makePlant({ id: 'p1', location: 'Old orchard - Bed 1' });
    const { groups } = groupByPlot(input({ plants: [plant] }));
    const orphan = findGroup(groups, 'Old orchard');
    expect(orphan?.plants.map((p) => p.id)).toEqual(['p1']);
    expect(orphan?.isConfigured).toBe(false);
  });

  it('orders configured plots, then unrecognised alphabetically, then unassigned', () => {
    const { groups } = groupByPlot(
      input({
        plants: [
          makePlant({ id: 'p1', location: 'Zebra plot' }),
          makePlant({ id: 'p2', location: 'Apple plot' }),
          makePlant({ id: 'p3', location: '' }),
        ],
      })
    );
    expect(groups.map((g) => g.id)).toEqual([
      'Home farm',
      'Paddy land',
      'Apple plot',
      'Zebra plot',
      UNASSIGNED_PLOT_ID,
    ]);
    expect(groups[groups.length - 1]?.name).toBe(UNASSIGNED_PLOT_NAME);
  });

  it('collapses everything into one district-named card when no plots are configured', () => {
    const { groups } = groupByPlot(
      input({
        parentLocations: [],
        plants: [
          makePlant({ id: 'p1', location: 'Anywhere' }),
          makePlant({ id: 'p2', location: '' }),
        ],
        tasks: [makeTaskTemplate({ id: 't1', plant_id: null, bed_id: null })],
      })
    );

    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe('Kanyakumari');
    expect(groups[0]?.isConfigured).toBe(false);
    expect(groups[0]?.plants).toHaveLength(2);
    expect(groups[0]?.tasks).toHaveLength(1);
  });

  it('ignores blank entries in the configured list', () => {
    const { groups } = groupByPlot(input({ parentLocations: ['Home farm', '  '] }));
    expect(groups.map((g) => g.id)).toEqual(['Home farm']);
  });
});

describe('matchesPlotFilter', () => {
  it('matches a plant whose parent segment is the plot', () => {
    expect(matchesPlotFilter({ location: 'Home farm - Bed 3' }, 'Home farm')).toBe(true);
    expect(matchesPlotFilter({ location: 'Home farm' }, 'Home farm')).toBe(true);
  });

  it('ignores case and surrounding whitespace, as groupByPlot does', () => {
    expect(matchesPlotFilter({ location: '  home FARM  - Bed 3' }, 'Home farm')).toBe(true);
  });

  it('does not match a different plot', () => {
    expect(matchesPlotFilter({ location: 'Paddy land - Bed 1' }, 'Home farm')).toBe(false);
  });

  // The substring matching this replaced put this plant on Home farm.
  it('does not match when only the child names the plot', () => {
    expect(matchesPlotFilter({ location: 'Paddy land - Home farm corner' }, 'Home farm')).toBe(
      false
    );
  });

  it('matches blank locations only under the unassigned bucket', () => {
    expect(matchesPlotFilter({ location: '' }, UNASSIGNED_PLOT_ID)).toBe(true);
    expect(matchesPlotFilter({ location: '   ' }, UNASSIGNED_PLOT_ID)).toBe(true);
    expect(matchesPlotFilter({ location: 'Home farm' }, UNASSIGNED_PLOT_ID)).toBe(false);
    expect(matchesPlotFilter({ location: '' }, 'Home farm')).toBe(false);
  });

  it('agrees with groupByPlot on the same population', () => {
    const plants = [
      makePlant({ id: 'p1', location: 'Home farm - Bed 3' }),
      makePlant({ id: 'p2', location: 'paddy land' }),
      makePlant({ id: 'p3', location: 'Paddy land - Home farm corner' }),
      makePlant({ id: 'p4', location: '' }),
    ];
    const { groups } = groupByPlot(input({ plants }));

    for (const plotId of ['Home farm', 'Paddy land', UNASSIGNED_PLOT_ID]) {
      expect(plants.filter((p) => matchesPlotFilter(p, plotId)).map((p) => p.id)).toEqual(
        findGroup(groups, plotId)?.plants.map((p) => p.id) ?? []
      );
    }
  });
});

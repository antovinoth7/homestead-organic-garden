import {
  Bed,
  FarmAlert,
  NeedsActionItem,
  Plant,
  UNASSIGNED_PLOT_ID,
} from '../../types/database.types';
import { buildNeedsActionItems } from '../../utils/needsActionItems';
import { groupByPlot, PlotGroupInput, PlotResolution } from '../../utils/plotGrouping';
import { makeBed } from '../fixtures/bed.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeFarmAlert } from '../fixtures/today.fixtures';

const PLOTS = ['Home farm', 'Paddy land'];

function group(overrides: Partial<PlotGroupInput> = {}): PlotResolution {
  return groupByPlot({
    parentLocations: PLOTS,
    fallbackName: 'Kanyakumari',
    plants: [],
    beds: [],
    tasks: [],
    logs: [],
    alerts: [],
    ...overrides,
  });
}

/** Runs the real grouping first, so the test covers the join the hook performs. */
function build(input: {
  parentLocations?: string[];
  plants?: Plant[];
  beds?: Bed[];
  alerts?: FarmAlert[];
}): NeedsActionItem[] {
  const plants = input.plants ?? [];
  const beds = input.beds ?? [];
  const { groups } = group({
    ...(input.parentLocations ? { parentLocations: input.parentLocations } : {}),
    plants,
    beds,
    alerts: input.alerts ?? [],
  });
  return buildNeedsActionItems({
    groups,
    plantsById: new Map(plants.map((p) => [p.id, p])),
    bedNames: Object.fromEntries(beds.map((b) => [b.id, b.name])),
  });
}

describe('buildNeedsActionItems — where', () => {
  it("names the plot and the section from a plant alert's location", () => {
    const plant = makePlant({ id: 'p1', location: 'Paddy land - Bed 3' });
    const alert = makeFarmAlert({ id: 'a1', type: 'health_sick', plantId: 'p1' });

    expect(build({ plants: [plant], alerts: [alert] })[0]?.where).toBe('Paddy land · Bed 3');
  });

  it("falls back to the plant's bed name when its location has no section", () => {
    const bed = makeBed({ id: 'b1', name: 'North Bed', parent_location: 'Home farm' });
    const plant = makePlant({ id: 'p1', location: 'Home farm', bed_id: 'b1' });
    const alert = makeFarmAlert({ id: 'a1', type: 'health_sick', plantId: 'p1' });

    expect(build({ plants: [plant], beds: [bed], alerts: [alert] })[0]?.where).toBe(
      'Home farm · North Bed'
    );
  });

  it('names the bed directly for a bed alert', () => {
    const bed = makeBed({ id: 'b1', name: 'North Bed', parent_location: 'Paddy land' });
    const alert = makeFarmAlert({ id: 'a1', type: 'rotation_due', bedId: 'b1' });

    expect(build({ beds: [bed], alerts: [alert] })[0]?.where).toBe('Paddy land · North Bed');
  });

  it('gives the plot alone when there is no bed or section to name', () => {
    const plant = makePlant({ id: 'p1', location: 'Home farm' });
    const alert = makeFarmAlert({ id: 'a1', type: 'health_sick', plantId: 'p1' });

    expect(build({ plants: [plant], alerts: [alert] })[0]?.where).toBe('Home farm');
  });

  it('labels an item that resolved to no plot as Unassigned', () => {
    const plant = makePlant({ id: 'p1', location: '' });
    const alert = makeFarmAlert({ id: 'a1', type: 'health_sick', plantId: 'p1' });

    const { groups } = group({ plants: [plant], alerts: [alert] });
    expect(groups.some((g) => g.id === UNASSIGNED_PLOT_ID)).toBe(true);
    expect(build({ plants: [plant], alerts: [alert] })[0]?.where).toBe('Unassigned');
  });

  it('drops the plot segment when the farm has only one plot', () => {
    const plant = makePlant({ id: 'p1', location: 'Home farm - Bed 3' });
    const alerts = [makeFarmAlert({ id: 'a1', type: 'health_sick', plantId: 'p1' })];

    const items = build({ parentLocations: ['Home farm'], plants: [plant], alerts });
    expect(items[0]?.where).toBe('Bed 3');
  });

  it('leaves `where` empty on a single-plot farm with no section or bed to name', () => {
    // Only segment available is the plot name, which a one-plot farm suppresses.
    const plant = makePlant({ id: 'p1', location: 'Home farm' });
    const alerts = [makeFarmAlert({ id: 'a1', type: 'health_sick', plantId: 'p1' })];

    const items = build({ parentLocations: ['Home farm'], plants: [plant], alerts });
    expect(items[0]?.where).toBe('');
  });

  it('shows the Unassigned bucket as a plot once it exists', () => {
    // A farm-level alert (no plant, no bed) creates the bucket, so the farm is
    // no longer single-plot and the segment reappears. No actionable type is
    // farm-level today, but the label must still be sane if one becomes so.
    const alerts = [makeFarmAlert({ id: 'a1', type: 'rotation_due' })];
    const items = build({ parentLocations: ['Home farm'], alerts });
    expect(items[0]?.where).toBe('Unassigned');
  });
});

describe('buildNeedsActionItems — ordering', () => {
  it('restores urgency order across plots rather than leaving plot order', () => {
    // Grouping walks plots in card order, which would put the Home farm warning
    // ahead of the Paddy land critical.
    const plants = [
      makePlant({ id: 'p1', name: 'Okra', location: 'Home farm' }),
      makePlant({ id: 'p2', name: 'Tomato', location: 'Paddy land' }),
    ];
    const alerts = [
      makeFarmAlert({ id: 'warn', type: 'harvest_due', severity: 'warning', plantId: 'p1' }),
      makeFarmAlert({ id: 'crit', type: 'health_sick', severity: 'critical', plantId: 'p2' }),
    ];

    const items = build({ plants, alerts });
    expect(items.map((i) => i.alert.id)).toEqual(['crit', 'warn']);
    expect(items.map((i) => i.where)).toEqual(['Paddy land', 'Home farm']);
  });

  it('returns every alert exactly once', () => {
    const plants = [
      makePlant({ id: 'p1', location: 'Home farm' }),
      makePlant({ id: 'p2', location: 'Paddy land' }),
    ];
    const alerts = [
      makeFarmAlert({ id: 'a1', plantId: 'p1' }),
      makeFarmAlert({ id: 'a2', plantId: 'p2' }),
      makeFarmAlert({ id: 'a3', plantId: 'p1' }),
    ];

    const items = build({ plants, alerts });
    expect(items.map((i) => i.alert.id).sort()).toEqual(['a1', 'a2', 'a3']);
  });

  it('returns nothing when there are no alerts', () => {
    expect(build({ plants: [makePlant({ id: 'p1', location: 'Home farm' })] })).toEqual([]);
  });
});

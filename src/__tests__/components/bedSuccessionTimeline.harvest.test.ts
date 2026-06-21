import { getDaysToHarvestRange, isTreeLikePlant } from '../../utils/timelineHarvest';
import { makePlant } from '../fixtures/plant.fixtures';

describe('BedSuccessionTimeline — harvest data resolution', () => {
  it('resolves real days-to-harvest from the catalog variety', () => {
    const range = getDaysToHarvestRange(
      makePlant({ name: 'Tomato', plant_type: 'vegetable' }),
    );
    expect(range.source).toBe('profile');
    expect(range.min).toBe(60);
    expect(range.max).toBe(90);
  });

  it('recovers real harvest data via plant_variety when the display name is custom', () => {
    const range = getDaysToHarvestRange(
      makePlant({ name: 'Appa’s Special Tomato', plant_variety: 'Tomato', plant_type: 'vegetable' }),
    );
    expect(range.source).toBe('profile');
    expect(range.min).toBe(60);
    expect(range.max).toBe(90);
  });

  it('falls back to the generic 55–75 window for genuinely unknown annuals', () => {
    const range = getDaysToHarvestRange(
      makePlant({ name: 'Totally Unknown Crop', plant_type: 'vegetable' }),
    );
    expect(range.source).toBe('fallback');
    expect(range.known).toBe(false);
    expect(range.min).toBe(55);
    expect(range.max).toBe(75);
  });

  it('renders trees as continuous (coconut daysToHarvest is a picking interval, not sow-to-harvest)', () => {
    const coconut = makePlant({
      name: 'Coconut',
      plant_variety: 'Tall Coconut',
      plant_type: 'coconut_tree',
    });
    // Tree-like ⇒ the component draws a continuous "established" bar, never an
    // annual grow→harvest window (the catalog's 60–90 days is the recurring nut
    // interval, with yearsToFirstHarvest: 6).
    expect(isTreeLikePlant(coconut)).toBe(true);
  });

  it('keeps the real sow-to-harvest window for lifecycle-perennial vegetables', () => {
    const drumstick = makePlant({ name: 'Drumstick', plant_type: 'vegetable' });
    // Not tree-like → keeps its meaningful grow→harvest window.
    expect(isTreeLikePlant(drumstick)).toBe(false);
    const range = getDaysToHarvestRange(drumstick);
    expect(range.source).toBe('profile');
    expect(range.min).toBeGreaterThan(75); // real long maturity, not the fallback
  });

  it('flags trees by plant type and leaves annual crops alone', () => {
    expect(isTreeLikePlant(makePlant({ name: 'Mango', plant_type: 'fruit_tree' }))).toBe(true);
    expect(isTreeLikePlant(makePlant({ name: 'Teak', plant_type: 'timber_tree' }))).toBe(true);
    expect(isTreeLikePlant(makePlant({ name: 'Beans', plant_type: 'vegetable' }))).toBe(false);
  });
});

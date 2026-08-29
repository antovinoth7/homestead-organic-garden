/// <reference types="jest" />
/**
 * Season behaviour of the watering interval.
 *
 * Deliberately separate from `plantWatering.test.ts`, which mocks
 * `getWateringFrequencyMultiplier` at module level and therefore cannot
 * exercise any of this. Nothing here is mocked: the unprimed active zone falls
 * back to Kanyakumari, the only zone with non-neutral multipliers, which is
 * exactly the zone under test.
 */
import {
  getEffectiveWateringIntervalDays,
  getPlantWaterStatus,
  describeWateringCycle,
} from '@/utils/plantWatering';
import { setActiveZone } from '@/config/zones';
import type { Plant } from '@/types/database.types';
import { makePlant } from '../fixtures/plant.fixtures';

// Kanyakumari ground multipliers: ne_monsoon (Oct–Dec) 3.0, cool_dry (Jan–Feb) 1.0.
const DEC_31 = Date.parse('2026-12-31T12:00:00+05:30');
const JAN_01 = Date.parse('2027-01-01T12:00:00+05:30');
const JAN_06 = Date.parse('2027-01-06T12:00:00+05:30');

/** Ground plant on a 3-day base, watered 28 Dec on the NE-monsoon cadence. */
const wateredInDecember = (overrides: Partial<Plant> = {}): Plant =>
  makePlant({
    space_type: 'ground',
    watering_frequency_days: 3,
    last_watered_date: '2026-12-28T12:00:00+05:30',
    last_watering_multiplier: 3,
    ...overrides,
  });

afterEach(() => setActiveZone(null));

describe('season boundary', () => {
  it('does not flip a plant overdue when the calendar crosses into Winter', () => {
    // The regression. `buildTaskDoneOps` froze this plant's next watering at
    // 28 Dec + 9 days = 6 Jan. Re-deriving the interval from January's 1.0
    // multiplier gave 3 days instead, so on New Year's Day the plant card
    // called it overdue while the Care Plan still showed 6 Jan.
    const plant = wateredInDecember();
    expect(getPlantWaterStatus(plant, DEC_31).overdue).toBe(false);
    expect(getPlantWaterStatus(plant, JAN_01).overdue).toBe(false);
  });

  it('still reports overdue once the recorded cycle has actually elapsed', () => {
    // 6 Jan is nine days on — the fix must not simply disable the check.
    expect(getPlantWaterStatus(wateredInDecember(), JAN_06).overdue).toBe(true);
  });

  it('keeps the interval the completion recorded', () => {
    expect(getEffectiveWateringIntervalDays(wateredInDecember(), JAN_01)).toBe(9);
  });

  it('does not flip a young, never-watered plant either', () => {
    // No record to read back, so this falls to the season multiplier as of the
    // plant's establishment date rather than today's.
    const seedling = makePlant({
      space_type: 'ground',
      watering_frequency_days: 3,
      planting_date: '2026-12-29T08:00:00+05:30',
      created_at: '2026-12-29T08:00:00+05:30',
    });
    expect(getPlantWaterStatus(seedling, DEC_31).overdue).toBe(false);
    expect(getPlantWaterStatus(seedling, JAN_01).overdue).toBe(false);
  });
});

describe('recorded multiplier', () => {
  it('composes with a later edit to the base interval', () => {
    // The reason a multiplier is recorded rather than a day count: the user
    // doubling their base interval must double the real gap, not replay 9 days.
    const plant = wateredInDecember({ watering_frequency_days: 6 });
    expect(getEffectiveWateringIntervalDays(plant, JAN_01)).toBe(18);
  });

  it('falls back to the season when the recorded value is absent or unusable', () => {
    // Watered in December with no record: reads NE monsoon from that date.
    const legacy = wateredInDecember({ last_watering_multiplier: undefined });
    expect(getEffectiveWateringIntervalDays(legacy, JAN_01)).toBe(9);
    expect(
      getEffectiveWateringIntervalDays(wateredInDecember({ last_watering_multiplier: 0 }), JAN_01)
    ).toBe(9);
  });

  it('still honours the watering-disabled and no-base guards', () => {
    expect(
      getEffectiveWateringIntervalDays(wateredInDecember({ watering_enabled: false }), JAN_01)
    ).toBeNull();
    expect(
      getEffectiveWateringIntervalDays(
        wateredInDecember({ watering_frequency_days: null }),
        JAN_01
      )
    ).toBeNull();
  });
});

describe('describeWateringCycle', () => {
  it('names the forecast reason when one was recorded', () => {
    const rained = wateredInDecember({ last_watering_multiplier: 2, last_watering_adjustment: 'rain' });
    expect(describeWateringCycle(rained, 'water', 3, JAN_01)).toEqual({
      iconKey: 'weather.rain',
      text: '6 days this cycle — rain expected',
    });

    const dry = wateredInDecember({ last_watering_multiplier: 1.5, last_watering_adjustment: 'dry' });
    expect(describeWateringCycle(dry, 'water', 3, JAN_01)?.text).toBe(
      '5 days this cycle — little rain forecast'
    );
  });

  it('names the season when the forecast did not move anything', () => {
    expect(describeWateringCycle(wateredInDecember(), 'water', 3, JAN_01)?.text).toBe(
      '9 days this cycle — NE Monsoon'
    );
  });

  it('says nothing when there is nothing to explain', () => {
    // Cycle lands on the base interval.
    expect(
      describeWateringCycle(wateredInDecember({ last_watering_multiplier: 1 }), 'water', 3, JAN_01)
    ).toBeNull();
    // Not a water task, and no plant at all.
    expect(describeWateringCycle(wateredInDecember(), 'prune', 3, JAN_01)).toBeNull();
    expect(describeWateringCycle(undefined, 'water', 3, JAN_01)).toBeNull();
  });
});

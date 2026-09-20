import {
  NumericRange,
  PlantNowRecommendation,
  PlantProfile,
  PlantType,
} from '../../types/database.types';
import { toPlantNowChips } from '../../utils/sowNowChips';

function profile(overrides: Partial<PlantProfile>): PlantProfile {
  return { plantType: 'vegetable', name: 'Test', ...overrides };
}

/** A lookup over a small fixture map, keyed the way the real one is. */
function lookupOver(
  entries: Record<string, PlantProfile>
): (plantType: PlantType, name: string) => PlantProfile | undefined {
  return (plantType, name) => entries[`${plantType}:${name}`];
}

describe('toPlantNowChips', () => {
  it('keys each chip by type and variety so the row is stable', () => {
    const chips = toPlantNowChips([{ plantType: 'vegetable', variety: 'Okra', action: 'sow' }]);
    expect(chips).toHaveLength(1);
    expect(chips[0]?.key).toBe('vegetable:Okra');
    expect(chips[0]?.label).toBe('Okra');
    expect(chips[0]?.action).toBe('sow');
    expect(chips[0]?.plantType).toBe('vegetable');
  });

  it('keeps unknown varieties image-resolvable by name', () => {
    const chips = toPlantNowChips([
      { plantType: 'vegetable', variety: 'Zzz Unknown Crop', action: 'sow' },
      { plantType: 'herb', variety: 'Zzz Unknown Herb', action: 'sow' },
    ]);
    expect(chips.map((chip) => chip.label)).toEqual(['Zzz Unknown Crop', 'Zzz Unknown Herb']);
    expect(chips.every((chip) => !('emoji' in chip))).toBe(true);
  });

  it('preserves the incoming order', () => {
    const chips = toPlantNowChips([
      { plantType: 'vegetable', variety: 'Amaranthus', action: 'sow' },
      { plantType: 'vegetable', variety: 'Okra', action: 'sow' },
      { plantType: 'vegetable', variety: 'Chilli', action: 'transplant' },
    ]);
    expect(chips.map((c) => c.label)).toEqual(['Amaranthus', 'Okra', 'Chilli']);
  });

  describe('catalog figures', () => {
    it('formats a days-to-harvest range and carries spacing through', () => {
      const chips = toPlantNowChips(
        [{ plantType: 'vegetable', variety: 'Amaranthus', action: 'sow' }],
        {
          lookup: lookupOver({
            'vegetable:Amaranthus': profile({
              daysToHarvest: { min: 25, max: 40 },
              spacingCm: 15,
            }),
          }),
        }
      );
      expect(chips[0]?.daysToHarvest).toBe('25–40 days');
      expect(chips[0]?.spacingCm).toBe(15);
    });

    it('collapses a single-figure range rather than printing "40–40 days"', () => {
      const chips = toPlantNowChips(
        [{ plantType: 'vegetable', variety: 'Radish', action: 'sow' }],
        {
          lookup: lookupOver({
            'vegetable:Radish': profile({ daysToHarvest: { min: 40, max: 40 } }),
          }),
        }
      );
      expect(chips[0]?.daysToHarvest).toBe('40 days');
    });

    it('nulls both figures when the crop has no profile, so the tile can drop the line', () => {
      const chips = toPlantNowChips(
        [{ plantType: 'vegetable', variety: 'Zzz Unknown Crop', action: 'sow' }],
        { lookup: lookupOver({}) }
      );
      expect(chips[0]?.daysToHarvest).toBeNull();
      expect(chips[0]?.spacingCm).toBeNull();
      // The tile still renders and still navigates.
      expect(chips[0]?.label).toBe('Zzz Unknown Crop');
      expect(chips[0]?.plantType).toBe('vegetable');
    });

    it('nulls figures the profile omits without dropping the ones it states', () => {
      const chips = toPlantNowChips(
        [{ plantType: 'vegetable', variety: 'Pumpkin', action: 'sow' }],
        {
          lookup: lookupOver({ 'vegetable:Pumpkin': profile({ spacingCm: 150 }) }),
        }
      );
      expect(chips[0]?.daysToHarvest).toBeNull();
      expect(chips[0]?.spacingCm).toBe(150);
    });
  });

  describe('when the yield lands', () => {
    /** Local-time, matching how the helper walks the calendar. */
    const at = (year: number, month: number, day: number): Date => new Date(year, month - 1, day);

    const chipFor = (
      daysToHarvest: NumericRange | undefined,
      today: Date
    ): PlantNowRecommendation | undefined =>
      toPlantNowChips([{ plantType: 'vegetable', variety: 'Test Crop', action: 'sow' }], {
        lookup: lookupOver({ 'vegetable:Test Crop': profile({ daysToHarvest }) }),
        today,
      })[0];

    it('measures from the outer bound, so the bed is not needed back early', () => {
      // 16 Aug + 40 days lands in September, not the 25-day minimum's August.
      expect(chipFor({ min: 25, max: 40 }, at(2026, 8, 16))?.harvestByLabel).toBe(
        'harvest by Sep'
      );
    });

    it('states the year once the crop runs past it', () => {
      // 16 Aug + 140 days is January of the next year.
      expect(chipFor({ min: 120, max: 140 }, at(2026, 8, 16))?.harvestByLabel).toBe(
        'harvest by Jan 2027'
      );
    });

    it('leaves the year off while the crop comes good the same year', () => {
      expect(chipFor({ min: 90, max: 110 }, at(2026, 8, 16))?.harvestByLabel).toBe(
        'harvest by Dec'
      );
    });

    it('rolls the month over correctly at a month boundary', () => {
      // 31 Jan + 30 days is 2 March, not February — the day-of-month carries.
      expect(chipFor({ min: 30, max: 30 }, at(2026, 1, 31))?.harvestByLabel).toBe(
        'harvest by Mar'
      );
    });

    it('nulls the label rather than guessing when the catalog states no range', () => {
      expect(chipFor(undefined, at(2026, 8, 16))?.harvestByLabel).toBeNull();
    });
  });

  it('defaults every derived field when no context is given', () => {
    const chips = toPlantNowChips([{ plantType: 'vegetable', variety: 'Okra', action: 'sow' }]);
    expect(chips[0]).toMatchObject({
      daysToHarvest: null,
      harvestByLabel: null,
      spacingCm: null,
      closing: false,
    });
  });

  it('flags only the crops whose window closes', () => {
    const chips = toPlantNowChips(
      [
        { plantType: 'vegetable', variety: 'Snake Gourd', action: 'sow' },
        { plantType: 'vegetable', variety: 'Amaranthus', action: 'sow' },
      ],
      { closingKeys: new Set(['vegetable:Snake Gourd']) }
    );
    expect(chips[0]?.closing).toBe(true);
    expect(chips[1]?.closing).toBe(false);
  });
});

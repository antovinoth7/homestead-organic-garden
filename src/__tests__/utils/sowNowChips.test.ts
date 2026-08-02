import { toPlantNowChips } from '../../utils/sowNowChips';
import { getPlantEmoji } from '../../utils/plantHelpers';

describe('toPlantNowChips', () => {
  it('keys each chip by type and variety so the row is stable', () => {
    const chips = toPlantNowChips([{ plantType: 'vegetable', variety: 'Okra', action: 'sow' }]);
    expect(chips).toHaveLength(1);
    expect(chips[0]?.key).toBe('vegetable:Okra');
    expect(chips[0]?.label).toBe('Okra');
    expect(chips[0]?.action).toBe('sow');
  });

  it('prefers the catalog emoji when the variety has one', () => {
    const catalogEmoji = getPlantEmoji('Tomato');
    const chips = toPlantNowChips([
      { plantType: 'vegetable', variety: 'Tomato', action: 'transplant' },
    ]);
    expect(chips[0]?.emoji).toBe(catalogEmoji);
  });

  it('falls back to the plant-type tier for an unknown variety', () => {
    const chips = toPlantNowChips([
      { plantType: 'vegetable', variety: 'Zzz Unknown Crop', action: 'sow' },
      { plantType: 'herb', variety: 'Zzz Unknown Herb', action: 'sow' },
    ]);
    expect(chips[0]?.emoji).toBe('🥕');
    expect(chips[1]?.emoji).toBe('🌿');
  });

  it('has a tier for every plant type, so nothing falls through to the generic', () => {
    const everyType = [
      'vegetable',
      'herb',
      'flower',
      'fruit_tree',
      'timber_tree',
      'coconut_tree',
      'shrub',
      'spinach',
    ] as const;

    const chips = toPlantNowChips(
      everyType.map((plantType) => ({ plantType, variety: `Zzz Unknown ${plantType}`, action: 'sow' }))
    );
    expect(chips.every((chip) => chip.emoji !== '🌱' || chip.label.includes('shrub'))).toBe(true);
  });

  it('preserves the incoming order', () => {
    const chips = toPlantNowChips([
      { plantType: 'vegetable', variety: 'Amaranthus', action: 'sow' },
      { plantType: 'vegetable', variety: 'Okra', action: 'sow' },
      { plantType: 'vegetable', variety: 'Chilli', action: 'transplant' },
    ]);
    expect(chips.map((c) => c.label)).toEqual(['Amaranthus', 'Okra', 'Chilli']);
  });
});

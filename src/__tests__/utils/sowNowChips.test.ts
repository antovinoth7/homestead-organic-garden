import { toPlantNowChips } from '../../utils/sowNowChips';

describe('toPlantNowChips', () => {
  it('keys each chip by type and variety so the row is stable', () => {
    const chips = toPlantNowChips([{ plantType: 'vegetable', variety: 'Okra', action: 'sow' }]);
    expect(chips).toHaveLength(1);
    expect(chips[0]?.key).toBe('vegetable:Okra');
    expect(chips[0]?.label).toBe('Okra');
    expect(chips[0]?.action).toBe('sow');
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
});

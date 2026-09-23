import { countGardenPlantsByCatalogName, signPlantVarietyCounts } from '@/utils/catalogCounts';
import { makePlant } from '../fixtures/plant.fixtures';

describe('signPlantVarietyCounts', () => {
  it('is stable when the same garden comes back in a different order', () => {
    const a = makePlant({ id: 'a', plant_type: 'vegetable', plant_variety: 'Tomato' });
    const b = makePlant({ id: 'b', plant_type: 'herb', plant_variety: 'Tulsi' });

    expect(signPlantVarietyCounts([a, b])).toBe(signPlantVarietyCounts([b, a]));
  });

  it('is stable across a fresh but structurally identical read', () => {
    const first = [makePlant({ id: 'a', plant_variety: 'Tomato' })];
    const second = [makePlant({ id: 'a', plant_variety: 'Tomato' })];

    expect(signPlantVarietyCounts(second)).toBe(signPlantVarietyCounts(first));
  });

  it('changes when a variety gains a plant', () => {
    const one = [makePlant({ id: 'a', plant_variety: 'Tomato' })];
    const two = [...one, makePlant({ id: 'b', plant_variety: 'Tomato' })];

    expect(signPlantVarietyCounts(two)).not.toBe(signPlantVarietyCounts(one));
  });

  it('changes when a plant is removed', () => {
    const both = [
      makePlant({ id: 'a', plant_variety: 'Tomato' }),
      makePlant({ id: 'b', plant_variety: 'Brinjal' }),
    ];

    expect(signPlantVarietyCounts(both.slice(0, 1))).not.toBe(signPlantVarietyCounts(both));
  });

  it('changes when a plant moves to another care model', () => {
    const asVegetable = [makePlant({ id: 'a', plant_type: 'vegetable', plant_variety: 'Basil' })];
    const asHerb = [makePlant({ id: 'a', plant_type: 'herb', plant_variety: 'Basil' })];

    expect(signPlantVarietyCounts(asHerb)).not.toBe(signPlantVarietyCounts(asVegetable));
  });

  it('ignores fields the catalog never reads', () => {
    const before = [makePlant({ id: 'a', plant_variety: 'Tomato', location: 'Front Garden' })];
    const after = [makePlant({ id: 'a', plant_variety: 'Tomato', location: 'Back Plot' })];

    expect(signPlantVarietyCounts(after)).toBe(signPlantVarietyCounts(before));
  });

  it('ignores a plant with no variety, exactly as the count map does', () => {
    const named = [makePlant({ id: 'a', plant_variety: 'Tomato' })];
    const withUnnamed = [...named, makePlant({ id: 'b', plant_variety: undefined })];

    expect(signPlantVarietyCounts(withUnnamed)).toBe(signPlantVarietyCounts(named));
  });

  it('signs an empty garden as an empty string', () => {
    expect(signPlantVarietyCounts([])).toBe('');
  });
});

describe('countGardenPlantsByCatalogName', () => {
  const names = { vegetable: ['Tomato', 'Capsicum'] };

  it('counts only plants still growing, not cleared (archived) ones', () => {
    const counts = countGardenPlantsByCatalogName(
      [
        makePlant({ id: 'a', plant_type: 'vegetable', plant_variety: 'Tomato' }),
        makePlant({
          id: 'b',
          plant_type: 'vegetable',
          plant_variety: 'Tomato',
          archived_at: '2026-08-01T00:00:00.000Z',
        }),
      ],
      names
    );
    expect(counts.vegetable.Tomato).toBe(1);
  });

  it('folds a plant saved under an alias into its catalog row', () => {
    const counts = countGardenPlantsByCatalogName(
      [
        makePlant({ id: 'a', plant_type: 'vegetable', plant_variety: 'Pepper' }),
        makePlant({ id: 'b', plant_type: 'vegetable', plant_variety: 'capsicum' }),
      ],
      names
    );
    expect(counts.vegetable.Capsicum).toBe(2);
  });

  it('keeps counts per plant type', () => {
    const counts = countGardenPlantsByCatalogName(
      [makePlant({ id: 'a', plant_type: 'herb', plant_variety: 'Tomato' })],
      names
    );
    expect(counts.vegetable.Tomato).toBeUndefined();
  });
});

describe('signPlantVarietyCounts — archiving', () => {
  it('changes when a plant is archived', () => {
    const growing = [makePlant({ id: 'a', plant_variety: 'Tomato' })];
    const cleared = [
      makePlant({ id: 'a', plant_variety: 'Tomato', archived_at: '2026-08-01T00:00:00.000Z' }),
    ];
    expect(signPlantVarietyCounts(cleared)).not.toBe(signPlantVarietyCounts(growing));
  });
});

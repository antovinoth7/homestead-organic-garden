import { plantToEntry, computeRemovedPlants } from '@/utils/bedEditReconcile';
import { makePlant } from '../fixtures/plant.fixtures';

describe('plantToEntry', () => {
  it('converts a persisted plant into a link-resolved wizard entry', () => {
    const plant = makePlant({
      id: 'p1',
      name: 'Amaranth',
      bed_layer: 'ground_cover',
      spacing_cm: 15,
      sort_order: 2,
    });

    expect(plantToEntry(plant)).toEqual({
      id: 'p1',
      name: 'Amaranth',
      layer: 'ground_cover',
      spacingCm: 15,
      sortOrder: 2,
      resolution: { kind: 'link', plantId: 'p1' },
    });
  });

  it('falls back to sensible defaults when bed fields are missing', () => {
    const plant = makePlant({ id: 'p2', name: 'Mystery', bed_layer: null, spacing_cm: null });
    const entry = plantToEntry(plant);

    expect(entry.layer).toBe('understory');
    expect(entry.spacingCm).toBe(30);
    expect(entry.sortOrder).toBe(0);
    expect(entry.resolution).toEqual({ kind: 'link', plantId: 'p2' });
  });
});

describe('computeRemovedPlants', () => {
  const a = makePlant({ id: 'a' });
  const b = makePlant({ id: 'b' });
  const c = makePlant({ id: 'c' });

  it('returns plants whose link entry was dropped', () => {
    const entries = [plantToEntry(a), plantToEntry(c)]; // b removed
    expect(computeRemovedPlants([a, b, c], entries)).toEqual([b]);
  });

  it('treats a kept link entry as not removed even if other entries are added', () => {
    const newEntry = {
      id: 'new1',
      name: 'Basil',
      layer: 'understory' as const,
      spacingCm: 20,
    }; // placeholder resolution
    const entries = [plantToEntry(a), plantToEntry(b), plantToEntry(c), newEntry];
    expect(computeRemovedPlants([a, b, c], entries)).toEqual([]);
  });

  it('returns every original plant when all entries are cleared', () => {
    expect(computeRemovedPlants([a, b, c], [])).toEqual([a, b, c]);
  });

  it('is a no-op when there are no original plants (create mode)', () => {
    const entries = [{ id: 'new1', name: 'Basil', layer: 'understory' as const, spacingCm: 20 }];
    expect(computeRemovedPlants([], entries)).toEqual([]);
  });
});

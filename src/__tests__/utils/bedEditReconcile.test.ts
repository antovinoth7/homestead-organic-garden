import { plantToEntry, plantToLayoutEntries, computeRemovedPlants } from '@/utils/bedEditReconcile';
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

describe('plantToLayoutEntries', () => {
  it('returns a single entry for a specimen doc', () => {
    const plant = makePlant({ id: 'p1', name: 'Brinjal', bed_layer: 'understory', spacing_cm: 45 });
    const entries = plantToLayoutEntries(plant);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(plantToEntry(plant));
  });

  it('expands a row-record into plant_count entries with unique ids', () => {
    const plant = makePlant({
      id: 'p2',
      name: 'Lettuce',
      bed_layer: 'understory',
      spacing_cm: 20,
      record_kind: 'row',
      plant_count: 6,
    });
    const entries = plantToLayoutEntries(plant);
    expect(entries).toHaveLength(6);
    expect(new Set(entries.map((e) => e.id)).size).toBe(6);
    for (const entry of entries) {
      expect(entry.name).toBe('Lettuce');
      expect(entry.layer).toBe('understory');
      expect(entry.spacingCm).toBe(20);
    }
  });

  it('treats a row-record without plant_count (or with a bad count) as one plant', () => {
    expect(plantToLayoutEntries(makePlant({ id: 'p3', record_kind: 'row' }))).toHaveLength(1);
    expect(
      plantToLayoutEntries(makePlant({ id: 'p4', record_kind: 'row', plant_count: 0 }))
    ).toHaveLength(1);
  });

  it('ignores plant_count on non-row docs', () => {
    expect(plantToLayoutEntries(makePlant({ id: 'p5', plant_count: 4 }))).toHaveLength(1);
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

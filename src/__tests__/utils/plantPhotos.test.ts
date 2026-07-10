import { collectPlantPhotos } from '@/utils/plantPhotos';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeJournalEntry } from '../fixtures/journal.fixtures';

describe('collectPlantPhotos', () => {
  it('returns an empty list for a null plant', () => {
    expect(collectPlantPhotos(null, [])).toEqual([]);
  });

  it('returns an empty list when a plant has no photos and no entries', () => {
    expect(collectPlantPhotos(makePlant({ photo_url: null }), [])).toEqual([]);
  });

  it('includes the plant photo dated by planting date', () => {
    const plant = makePlant({
      id: 'p1',
      photo_url: 'file:///plant.jpg',
      photo_filename: 'plant.jpg',
      planting_date: '2026-01-05T00:00:00.000Z',
    });
    const photos = collectPlantPhotos(plant, []);
    expect(photos).toHaveLength(1);
    expect(photos[0]).toMatchObject({
      source: 'plant',
      uri: 'file:///plant.jpg',
      filename: 'plant.jpg',
      date: '2026-01-05T00:00:00.000Z',
    });
  });

  it('falls back to created_at when the plant has no planting date', () => {
    const plant = makePlant({ photo_url: 'file:///p.jpg', created_at: '2026-02-02T00:00:00.000Z' });
    expect(collectPlantPhotos(plant, [])[0]?.date).toBe('2026-02-02T00:00:00.000Z');
  });

  it('aggregates multi-photo journal entries and pest photos, newest-first', () => {
    const plant = makePlant({
      id: 'p1',
      photo_url: 'file:///plant.jpg',
      planting_date: '2026-01-01T00:00:00.000Z',
      pest_disease_history: [
        {
          id: 'pest1',
          type: 'pest',
          name: 'Aphids',
          occurredAt: '2026-03-01T00:00:00.000Z',
          resolved: false,
          photo_filename: 'aphids.jpg',
        },
      ],
    });
    const entry = makeJournalEntry({
      id: 'e1',
      created_at: '2026-02-01T00:00:00.000Z',
      photo_urls: ['file:///a.jpg', 'file:///b.jpg'],
      photo_filenames: ['a.jpg', 'b.jpg'],
    });

    const photos = collectPlantPhotos(plant, [entry]);

    expect(photos.map((p) => p.source)).toEqual(['pest_disease', 'journal', 'journal', 'plant']);
    expect(photos.find((p) => p.source === 'pest_disease')).toMatchObject({
      uri: null,
      filename: 'aphids.jpg',
    });
    expect(photos.filter((p) => p.source === 'journal').map((p) => p.uri)).toEqual([
      'file:///a.jpg',
      'file:///b.jpg',
    ]);
  });

  it('de-duplicates repeated URIs', () => {
    const plant = makePlant({ photo_url: 'file:///dup.jpg', planting_date: '2026-01-01T00:00:00.000Z' });
    const entry = makeJournalEntry({
      id: 'e1',
      created_at: '2026-02-01T00:00:00.000Z',
      photo_urls: ['file:///dup.jpg'],
    });
    const photos = collectPlantPhotos(plant, [entry]);
    expect(photos).toHaveLength(1);
  });

  it('skips empty URI strings in journal entries', () => {
    const plant = makePlant({ photo_url: null });
    const entry = makeJournalEntry({ id: 'e1', photo_urls: ['', 'file:///real.jpg'] });
    const photos = collectPlantPhotos(plant, [entry]);
    expect(photos).toHaveLength(1);
    expect(photos[0]?.uri).toBe('file:///real.jpg');
  });
});

import {
  comparePlantNames,
  plantNameSectionLetter,
  sortPlantNames,
  sortPlantsBy,
} from '@/utils/plantSort';
import { makePlant } from '../fixtures/plant.fixtures';
import { buildCatalogSubtitle } from '@/utils/catalogSummaries';

describe('comparePlantNames', () => {
  it('orders A–Z', () => {
    expect(sortPlantNames(['Tomato', 'Ash Gourd', 'Brinjal'])).toEqual([
      'Ash Gourd',
      'Brinjal',
      'Tomato',
    ]);
  });

  // Case must not split a letter group: 'ash gourd' has to land beside
  // 'Ash Gourd', not in a separate bucket after every capitalised name.
  it('ignores case', () => {
    expect(comparePlantNames('ash gourd', 'Ash Gourd')).toBe(0);
    expect(sortPlantNames(['banana', 'Apple', 'cherry', 'Beetroot'])).toEqual([
      'Apple',
      'banana',
      'Beetroot',
      'cherry',
    ]);
  });

  it('sorts embedded numbers by value, not by digit', () => {
    expect(sortPlantNames(['Tomato 10', 'Tomato 2'])).toEqual(['Tomato 2', 'Tomato 10']);
  });

  it('does not mutate the input', () => {
    const input = ['Tomato', 'Brinjal'];
    sortPlantNames(input);
    expect(input).toEqual(['Tomato', 'Brinjal']);
  });
});

describe('sortPlantsBy', () => {
  const okra = makePlant({
    id: 'okra',
    name: 'okra',
    created_at: '2026-03-01T00:00:00.000Z',
    planting_date: '2025-01-10',
    health_status: 'sick',
  });
  const tomato = makePlant({
    id: 'tomato',
    name: 'Tomato 10',
    created_at: '2026-01-01T00:00:00.000Z',
    planting_date: '2024-06-01',
    health_status: 'healthy',
  });
  const tomato2 = makePlant({
    id: 'tomato2',
    name: 'Tomato 2',
    created_at: '2026-02-01T00:00:00.000Z',
    health_status: 'recovering',
  });
  const plants = [okra, tomato, tomato2];
  const ids = (list: readonly { id: string }[]): string[] => list.map((p) => p.id);

  it('orders newest and oldest by created_at', () => {
    expect(ids(sortPlantsBy(plants, 'newest'))).toEqual(['okra', 'tomato2', 'tomato']);
    expect(ids(sortPlantsBy(plants, 'oldest'))).toEqual(['tomato', 'tomato2', 'okra']);
  });

  it('orders names with the shared plant-name rule (case-insensitive, numeric)', () => {
    expect(ids(sortPlantsBy(plants, 'name'))).toEqual(['okra', 'tomato2', 'tomato']);
  });

  it('orders health healthy → recovering → stressed → sick, unset reading as healthy', () => {
    const unset = makePlant({ id: 'unset', health_status: null });
    expect(ids(sortPlantsBy([okra, tomato2, unset, tomato], 'health'))).toEqual([
      'unset',
      'tomato',
      'tomato2',
      'okra',
    ]);
  });

  it('puts the oldest planting first for age, and plants with no date before both', () => {
    expect(ids(sortPlantsBy(plants, 'age'))).toEqual(['tomato2', 'tomato', 'okra']);
  });

  it('keeps the input order for ties and for unparseable dates', () => {
    const a = makePlant({ id: 'a', created_at: 'not a date' });
    const b = makePlant({ id: 'b', created_at: 'also bad' });
    const c = makePlant({ id: 'c', created_at: '2026-01-01T00:00:00.000Z' });
    expect(ids(sortPlantsBy([a, b, c], 'newest'))).toEqual(['c', 'a', 'b']);
    expect(ids(sortPlantsBy([b, a], 'oldest'))).toEqual(['b', 'a']);
  });

  it('returns a new array and leaves the input untouched', () => {
    const input = [tomato, okra];
    const sorted = sortPlantsBy(input, 'newest');
    expect(sorted).not.toBe(input);
    expect(ids(input)).toEqual(['tomato', 'okra']);
  });
});

describe('plantNameSectionLetter', () => {
  it('uses the upper-cased first letter', () => {
    expect(plantNameSectionLetter('brinjal')).toBe('B');
    expect(plantNameSectionLetter('Ash Gourd')).toBe('A');
  });

  it('ignores leading whitespace', () => {
    expect(plantNameSectionLetter('  Tomato')).toBe('T');
  });

  it('buckets names that do not start with a letter under #', () => {
    expect(plantNameSectionLetter('123 Gourd')).toBe('#');
    expect(plantNameSectionLetter('கீரை')).toBe('#');
    expect(plantNameSectionLetter('')).toBe('#');
  });
});

describe('buildCatalogSubtitle', () => {
  it('prefers the description', () => {
    expect(buildCatalogSubtitle('Climbing spice vine', 3)).toBe('Climbing spice vine');
  });

  it('falls back to a variety count when there is no description', () => {
    expect(buildCatalogSubtitle(undefined, 3)).toBe('3 varieties');
    expect(buildCatalogSubtitle('   ', 1)).toBe('1 variety');
  });

  it('returns undefined when there is neither', () => {
    expect(buildCatalogSubtitle(undefined, 0)).toBeUndefined();
  });
});

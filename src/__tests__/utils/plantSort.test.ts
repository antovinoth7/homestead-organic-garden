import {
  comparePlantNames,
  plantNameSectionLetter,
  sortPlantNames,
} from '@/utils/plantSort';
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

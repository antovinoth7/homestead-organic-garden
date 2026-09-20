/// <reference types="jest" />
import { getCompanionSuggestions, getIncompatiblePlants } from '../../utils/plantHelpers';

describe('getCompanionSuggestions', () => {
  it('returns companions for an exact-cased key', () => {
    expect(getCompanionSuggestions('Tomato')).toEqual(
      expect.arrayContaining(['Basil', 'Marigold'])
    );
  });

  it('is case-insensitive', () => {
    expect(getCompanionSuggestions('tomato')).toEqual(getCompanionSuggestions('Tomato'));
  });

  it('resolves aliases (Okra → Ladies Finger)', () => {
    expect(getCompanionSuggestions('Okra')).toEqual(getCompanionSuggestions('Ladies Finger'));
    expect(getCompanionSuggestions('Okra').length).toBeGreaterThan(0);
  });

  it('surfaces Tamil Nadu plantation crops (Coconut)', () => {
    expect(getCompanionSuggestions('Coconut')).toEqual(
      expect.arrayContaining(['Banana', 'Turmeric', 'Ginger'])
    );
  });

  it('returns an empty array for an unknown plant', () => {
    expect(getCompanionSuggestions('Nonexistent Plant')).toEqual([]);
  });

  it('returns an empty array for nullish input', () => {
    expect(getCompanionSuggestions(null)).toEqual([]);
    expect(getCompanionSuggestions(undefined)).toEqual([]);
  });
});

describe('getIncompatiblePlants', () => {
  it('returns bad companions for a key', () => {
    expect(getIncompatiblePlants('Brinjal')).toEqual(
      expect.arrayContaining(['Fennel', 'Potato'])
    );
  });

  it('resolves aliases (Eggplant → Brinjal)', () => {
    expect(getIncompatiblePlants('Eggplant')).toEqual(getIncompatiblePlants('Brinjal'));
  });
});

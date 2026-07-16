/// <reference types="jest" />
import {
  buildGeneratedPlantNameBase,
  isGeneratedPlantName,
  buildGeneratedPlantName,
} from '../../utils/plantNameGenerator';

describe('buildGeneratedPlantNameBase', () => {
  it('returns empty when plantVariety is missing', () => {
    expect(buildGeneratedPlantNameBase('vegetable', '', 'Cherry')).toBe('');
  });

  it('uses plantVariety alone when no variety', () => {
    expect(buildGeneratedPlantNameBase('vegetable', 'Tomato', '')).toBe('Tomato');
  });

  it('combines plantVariety and variety with a dash', () => {
    expect(buildGeneratedPlantNameBase('vegetable', 'Tomato', 'Cherry')).toBe('Tomato - Cherry');
  });

  it('uses variety alone when it already contains the plantVariety', () => {
    expect(buildGeneratedPlantNameBase('vegetable', 'Tomato', 'Cherry Tomato')).toBe(
      'Cherry Tomato'
    );
  });

  it('appends a 2-digit planting year for trees', () => {
    expect(
      buildGeneratedPlantNameBase('fruit_tree', 'Mango', '', '2026-03-01')
    ).toBe("Mango '26");
  });

  it('does not append a year for non-trees', () => {
    expect(buildGeneratedPlantNameBase('vegetable', 'Tomato', '', '2026-03-01')).toBe('Tomato');
  });

  it('appends a location token in parentheses', () => {
    expect(
      buildGeneratedPlantNameBase('vegetable', 'Tomato', '', undefined, 'Backyard Garden')
    ).toBe('Tomato (Backyard)');
  });

  it('prefers the explicit locationShortName token', () => {
    expect(
      buildGeneratedPlantNameBase('vegetable', 'Tomato', '', undefined, 'Backyard Garden', 'BG')
    ).toBe('Tomato (BG)');
  });
});

describe('isGeneratedPlantName', () => {
  it('matches the bare base', () => {
    expect(isGeneratedPlantName('Tomato', 'Tomato')).toBe(true);
  });

  it('matches a numbered variant', () => {
    expect(isGeneratedPlantName('Tomato #3', 'Tomato')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isGeneratedPlantName('tomato #2', 'Tomato')).toBe(true);
  });

  it('rejects an unrelated name', () => {
    expect(isGeneratedPlantName('Brinjal', 'Tomato')).toBe(false);
  });

  it('returns false for empty inputs', () => {
    expect(isGeneratedPlantName('', 'Tomato')).toBe(false);
    expect(isGeneratedPlantName('Tomato', '')).toBe(false);
  });
});

describe('buildGeneratedPlantName', () => {
  it('returns the bare base when no plant uses it', () => {
    expect(buildGeneratedPlantName('Tomato', [])).toBe('Tomato');
  });

  it('starts numbering at #2 when the base is taken', () => {
    expect(buildGeneratedPlantName('Tomato', [{ id: 'a', name: 'Tomato' }])).toBe('Tomato #2');
  });

  it('fills the lowest free suffix hole', () => {
    const existing = [
      { id: 'a', name: 'Tomato' },
      { id: 'b', name: 'Tomato #2' },
      { id: 'c', name: 'Tomato #4' },
    ];
    expect(buildGeneratedPlantName('Tomato', existing)).toBe('Tomato #3');
  });

  it('skips consecutive taken suffixes', () => {
    const existing = [
      { id: 'a', name: 'Tomato' },
      { id: 'b', name: 'Tomato #2' },
      { id: 'c', name: 'Tomato #3' },
    ];
    expect(buildGeneratedPlantName('Tomato', existing)).toBe('Tomato #4');
  });

  it('ignores the plant currently being edited', () => {
    const existing = [{ id: 'me', name: 'Tomato' }];
    expect(buildGeneratedPlantName('Tomato', existing, 'me')).toBe('Tomato');
  });

  it('keeps the current generated name when it still matches the base', () => {
    const existing = [
      { id: 'me', name: 'Tomato #2' },
      { id: 'other', name: 'Tomato' },
    ];
    expect(buildGeneratedPlantName('Tomato', existing, 'me', 'Tomato #2')).toBe('Tomato #2');
  });

  it('does not collide with a sibling that holds the bare base', () => {
    // Two distinct plants sharing a base must not both resolve to it.
    const first = buildGeneratedPlantName('Tomato', []);
    expect(first).toBe('Tomato');
    const second = buildGeneratedPlantName('Tomato', [{ id: 'a', name: first }]);
    expect(second).toBe('Tomato #2');
  });
});

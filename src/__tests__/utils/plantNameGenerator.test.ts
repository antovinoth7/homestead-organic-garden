/// <reference types="jest" />
import {
  buildGeneratedPlantNameBase,
  isGeneratedPlantName,
  buildGeneratedPlantName,
} from '../../utils/plantNameGenerator';

describe('buildGeneratedPlantNameBase', () => {
  it('returns empty when plantVariety is missing', () => {
    expect(buildGeneratedPlantNameBase('', 'Cherry')).toBe('');
  });

  it('uses plantVariety alone when no variety', () => {
    expect(buildGeneratedPlantNameBase('Tomato', '')).toBe('Tomato');
  });

  it('combines plantVariety and variety with a dash', () => {
    expect(buildGeneratedPlantNameBase('Tomato', 'Cherry')).toBe('Tomato - Cherry');
  });

  it('uses variety alone when it already contains the plantVariety', () => {
    expect(buildGeneratedPlantNameBase('Tomato', 'Cherry Tomato')).toBe('Cherry Tomato');
  });

  it('appends YYYYMM from the planting date', () => {
    expect(buildGeneratedPlantNameBase('Mango', '', '2026-03-01')).toBe('Mango-202603');
  });

  it('omits the month segment when there is no planting date', () => {
    expect(buildGeneratedPlantNameBase('Tomato', '')).toBe('Tomato');
  });

  it('appends the first word of the location when no short name', () => {
    expect(buildGeneratedPlantNameBase('Tomato', '', undefined, 'Backyard Garden')).toBe(
      'Tomato-Backyard'
    );
  });

  it('prefers the explicit locationShortName token', () => {
    expect(buildGeneratedPlantNameBase('Tomato', '', undefined, 'Backyard Garden', 'BG')).toBe(
      'Tomato-BG'
    );
  });

  it('builds the full Variety-ShortPlace-YYYYMM base', () => {
    expect(buildGeneratedPlantNameBase('Mango', '', '2026-01-15', 'Mangalam', 'MNG')).toBe(
      'Mango-MNG-202601'
    );
  });
});

describe('isGeneratedPlantName', () => {
  it('matches the bare base', () => {
    expect(isGeneratedPlantName('Mango-MNG-202601', 'Mango-MNG-202601')).toBe(true);
  });

  it('matches a numbered variant', () => {
    expect(isGeneratedPlantName('Mango-MNG-202601-#03', 'Mango-MNG-202601')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isGeneratedPlantName('tomato-#02', 'Tomato')).toBe(true);
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
    expect(buildGeneratedPlantName('Mango-MNG-202601', [])).toBe('Mango-MNG-202601');
  });

  it('starts numbering at #02 when the base is taken', () => {
    expect(
      buildGeneratedPlantName('Mango-MNG-202601', [{ id: 'a', name: 'Mango-MNG-202601' }])
    ).toBe('Mango-MNG-202601-#02');
  });

  it('fills the lowest free suffix hole', () => {
    const existing = [
      { id: 'a', name: 'Tomato' },
      { id: 'b', name: 'Tomato-#02' },
      { id: 'c', name: 'Tomato-#04' },
    ];
    expect(buildGeneratedPlantName('Tomato', existing)).toBe('Tomato-#03');
  });

  it('skips consecutive taken suffixes', () => {
    const existing = [
      { id: 'a', name: 'Tomato' },
      { id: 'b', name: 'Tomato-#02' },
      { id: 'c', name: 'Tomato-#03' },
    ];
    expect(buildGeneratedPlantName('Tomato', existing)).toBe('Tomato-#04');
  });

  it('ignores the plant currently being edited', () => {
    const existing = [{ id: 'me', name: 'Tomato' }];
    expect(buildGeneratedPlantName('Tomato', existing, 'me')).toBe('Tomato');
  });

  it('keeps the current generated name when it still matches the base', () => {
    const existing = [
      { id: 'me', name: 'Tomato-#02' },
      { id: 'other', name: 'Tomato' },
    ];
    expect(buildGeneratedPlantName('Tomato', existing, 'me', 'Tomato-#02')).toBe('Tomato-#02');
  });

  it('does not collide with a sibling that holds the bare base', () => {
    // Two distinct plants sharing a base must not both resolve to it.
    const first = buildGeneratedPlantName('Tomato', []);
    expect(first).toBe('Tomato');
    const second = buildGeneratedPlantName('Tomato', [{ id: 'a', name: first }]);
    expect(second).toBe('Tomato-#02');
  });
});

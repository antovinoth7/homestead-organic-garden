/// <reference types="jest" />
import { plantTypeFromName } from '../../utils/plantTypeFromName';

describe('plantTypeFromName', () => {
  it('returns vegetable for a known vegetable', () => {
    expect(plantTypeFromName('Tomato')).toBe('vegetable');
    expect(plantTypeFromName('Brinjal')).toBe('vegetable');
  });

  it('returns flower for Marigold', () => {
    expect(plantTypeFromName('Marigold')).toBe('flower');
  });

  it('returns herb for Basil', () => {
    expect(plantTypeFromName('Basil')).toBe('herb');
  });

  it('is case-insensitive', () => {
    expect(plantTypeFromName('tomato')).toBe('vegetable');
    expect(plantTypeFromName('TOMATO')).toBe('vegetable');
  });

  it('falls back to vegetable for unknown names', () => {
    expect(plantTypeFromName('NotARealPlant')).toBe('vegetable');
  });

  it('falls back to vegetable for empty input', () => {
    expect(plantTypeFromName('')).toBe('vegetable');
    expect(plantTypeFromName('   ')).toBe('vegetable');
  });
});

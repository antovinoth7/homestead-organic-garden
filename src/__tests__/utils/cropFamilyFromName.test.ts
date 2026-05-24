/// <reference types="jest" />
import { cropFamilyFromName } from '../../utils/cropFamilyFromName';

describe('cropFamilyFromName', () => {
  it('returns solanaceae for Tomato', () => {
    expect(cropFamilyFromName('Tomato')).toBe('solanaceae');
  });

  it('returns other for Marigold', () => {
    expect(cropFamilyFromName('Marigold')).toBe('other');
  });

  it('is case-insensitive', () => {
    expect(cropFamilyFromName('tomato')).toBe('solanaceae');
    expect(cropFamilyFromName('  TOMATO  ')).toBe('solanaceae');
  });

  it('returns null for plants not in any guild template', () => {
    expect(cropFamilyFromName('Quinoa')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(cropFamilyFromName('')).toBeNull();
  });
});

/// <reference types="jest" />
import { cropFamilyFromName } from '../../utils/cropFamilyFromName';

describe('cropFamilyFromName', () => {
  it('returns solanaceae for Tomato', () => {
    expect(cropFamilyFromName('Tomato')).toBe('solanaceae');
  });

  it('returns flower for an ornamental', () => {
    // The guild template said `other`; `flower` is the value the CropFamily enum
    // carries for ornamentals, and what BedPlantPickerSheet already assigns.
    expect(cropFamilyFromName('Marigold')).toBe('flower');
  });

  it('answers for the plants the guild-template scan used to miss', () => {
    // None of these appears in any guild template, so all of them returned null
    // before — which meant rotation could not see Potato following Tomato.
    expect(cropFamilyFromName('Potato')).toBe('solanaceae');
    expect(cropFamilyFromName('Cabbage')).toBe('brassica');
    expect(cropFamilyFromName('Knol Khol')).toBe('brassica');
    expect(cropFamilyFromName('Onion')).toBe('allium');
    expect(cropFamilyFromName('Garlic')).toBe('allium');
    expect(cropFamilyFromName('Cucumber')).toBe('cucurbit');
    expect(cropFamilyFromName('Watermelon')).toBe('cucurbit');
    expect(cropFamilyFromName('Ponnanganni Keerai')).toBe('amaranthaceae');
    expect(cropFamilyFromName('Mustard Greens')).toBe('brassica');
    expect(cropFamilyFromName('Turmeric')).toBe('zingiberaceae');
  });

  it('resolves through the alias table', () => {
    expect(cropFamilyFromName('Okra')).toBe('malvaceae');
    expect(cropFamilyFromName('Methi')).toBe('legume');
    expect(cropFamilyFromName('Pepper')).toBe('solanaceae');
  });

  it('is `other` for a tree, which is never rotated', () => {
    expect(cropFamilyFromName('Mango')).toBe('other');
    expect(cropFamilyFromName('Tall Coconut')).toBe('other');
  });

  it('is case-insensitive', () => {
    expect(cropFamilyFromName('tomato')).toBe('solanaceae');
    expect(cropFamilyFromName('  TOMATO  ')).toBe('solanaceae');
  });

  it('returns null for a plant the app does not know', () => {
    expect(cropFamilyFromName('Quinoa')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(cropFamilyFromName('')).toBeNull();
  });
});

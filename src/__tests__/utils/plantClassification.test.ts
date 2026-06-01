/// <reference types="jest" />
import { classifyAsRowRecord } from '../../utils/plantClassification';
import type { BedType } from '../../types/database.types';

describe('classifyAsRowRecord', () => {
  describe('hard overrides', () => {
    it('three_sisters bed is always specimen, regardless of spacing', () => {
      expect(classifyAsRowRecord(10, 'three_sisters', false)).toBe(false);
      expect(classifyAsRowRecord(25, 'three_sisters', false)).toBe(false);
      expect(classifyAsRowRecord(60, 'three_sisters', false)).toBe(false);
    });

    it('climber_trellis bed is always specimen', () => {
      expect(classifyAsRowRecord(10, 'climber_trellis', false)).toBe(false);
      expect(classifyAsRowRecord(100, 'climber_trellis', false)).toBe(false);
    });

    it('companions are always specimen, regardless of bed type or spacing', () => {
      expect(classifyAsRowRecord(15, 'leafy', true)).toBe(false);
      expect(classifyAsRowRecord(20, 'spice', true)).toBe(false);
      expect(classifyAsRowRecord(45, 'fruiting', true)).toBe(false);
    });
  });

  describe('spacing thresholds', () => {
    it('spacing < 30cm → row-record', () => {
      expect(classifyAsRowRecord(10, 'leafy', false)).toBe(true);
      expect(classifyAsRowRecord(15, 'leafy', false)).toBe(true);
      expect(classifyAsRowRecord(20, 'spice', false)).toBe(true);
      expect(classifyAsRowRecord(25, 'root_legume', false)).toBe(true);
      expect(classifyAsRowRecord(29, 'medicinal_guild', false)).toBe(true);
    });

    it('spacing >= 45cm → specimen', () => {
      expect(classifyAsRowRecord(45, 'fruiting', false)).toBe(false);
      expect(classifyAsRowRecord(60, 'fruiting', false)).toBe(false);
      expect(classifyAsRowRecord(100, 'leafy', false)).toBe(false);
      expect(classifyAsRowRecord(100, 'spice', false)).toBe(false);
    });

    it('30 <= spacing < 45 → bed type decides; fruiting → specimen', () => {
      expect(classifyAsRowRecord(30, 'fruiting', false)).toBe(false);
      expect(classifyAsRowRecord(40, 'fruiting', false)).toBe(false);
      expect(classifyAsRowRecord(44, 'fruiting', false)).toBe(false);
    });

    it('30 <= spacing < 45 → bed type decides; non-fruiting → row', () => {
      expect(classifyAsRowRecord(30, 'leafy', false)).toBe(true);
      expect(classifyAsRowRecord(35, 'spice', false)).toBe(true);
      expect(classifyAsRowRecord(40, 'root_legume', false)).toBe(true);
      expect(classifyAsRowRecord(44, 'medicinal_guild', false)).toBe(true);
    });
  });

  describe('realistic guild template inputs', () => {
    it('leafy bed: spinach 15cm → row', () => {
      expect(classifyAsRowRecord(15, 'leafy', false)).toBe(true);
    });

    it('leafy bed: amaranth 20cm → row', () => {
      expect(classifyAsRowRecord(20, 'leafy', false)).toBe(true);
    });

    it('leafy bed: drumstick outlier 100cm → specimen', () => {
      expect(classifyAsRowRecord(100, 'leafy', false)).toBe(false);
    });

    it('fruiting bed: tomato 60cm → specimen', () => {
      expect(classifyAsRowRecord(60, 'fruiting', false)).toBe(false);
    });

    it('fruiting bed: ladies finger 45cm → specimen', () => {
      expect(classifyAsRowRecord(45, 'fruiting', false)).toBe(false);
    });

    it('spice bed: ginger 20cm → row', () => {
      expect(classifyAsRowRecord(20, 'spice', false)).toBe(true);
    });

    it('spice bed: curry leaf outlier 100cm → specimen', () => {
      expect(classifyAsRowRecord(100, 'spice', false)).toBe(false);
    });
  });

  describe('exhaustive bed type coverage at dense spacing', () => {
    const denseBedTypes: BedType[] = [
      'leafy',
      'spice',
      'root_legume',
      'medicinal_guild',
    ];

    it.each(denseBedTypes)('%s at 20cm → row', (bedType) => {
      expect(classifyAsRowRecord(20, bedType, false)).toBe(true);
    });
  });
});

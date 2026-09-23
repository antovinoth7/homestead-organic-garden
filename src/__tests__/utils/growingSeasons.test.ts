import {
  GROWING_SEASON_OPTIONS,
  LEGACY_SEASON_VALUES,
  growingSeasonLabel,
  normalizeSeasonValue,
} from '@/utils/plantLabels';

const OPTION_VALUES = new Set(GROWING_SEASON_OPTIONS.map((option) => option.value));

describe('growing season vocabulary', () => {
  it('no longer offers Kharif or Rabi', () => {
    for (const option of GROWING_SEASON_OPTIONS) {
      expect(option.label).not.toMatch(/kharif|rabi/i);
      expect(option.value).not.toMatch(/kharif|rabi/i);
    }
  });

  it('gives every seasonal option its pattam', () => {
    for (const option of GROWING_SEASON_OPTIONS) {
      if (option.value === 'Year Round') continue;
      expect(option.description).toMatch(/pattam$/);
      expect(option.tamilLabel).toMatch(/பட்டம்$/);
    }
  });

  it('maps every retired value onto a current option', () => {
    for (const [legacy, current] of Object.entries(LEGACY_SEASON_VALUES)) {
      expect(OPTION_VALUES.has(current)).toBe(true);
      expect(normalizeSeasonValue(legacy)).toBe(current);
    }
  });

  it('passes current and free-text values through unchanged', () => {
    expect(normalizeSeasonValue('SW Monsoon (Jun–Sep)')).toBe('SW Monsoon (Jun–Sep)');
    expect(normalizeSeasonValue('June–July and October–November')).toBe(
      'June–July and October–November'
    );
    expect(normalizeSeasonValue('Southwest Monsoon (Jun-Sep)')).toBe('SW Monsoon (Jun–Sep)');
  });

  describe('growingSeasonLabel', () => {
    it('labels a retired value by its replacement', () => {
      expect(growingSeasonLabel('Kharif (Jun–Sep)')).toBe('SW Monsoon (Jun–Sep)');
    });

    it('shows free text as written instead of blanking it', () => {
      expect(growingSeasonLabel('Mar–Jul')).toBe('Mar–Jul');
      expect(growingSeasonLabel('Cool Dry (Oct–Feb)')).toBe('NE Monsoon + Winter (Oct–Feb)');
    });

    it('is empty for a missing season', () => {
      expect(growingSeasonLabel(undefined)).toBe('');
      expect(growingSeasonLabel('   ')).toBe('');
    });
  });
});

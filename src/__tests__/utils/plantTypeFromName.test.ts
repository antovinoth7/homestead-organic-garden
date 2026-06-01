/// <reference types="jest" />
import { plantTypeFromName, resolvePlantType } from '../../utils/plantTypeFromName';
import { GUILD_TEMPLATES } from '../../config/beds/guildTemplates';
import { DYNAMIC_ACCUMULATORS } from '../../config/beds/dynamicAccumulators';

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

describe('resolvePlantType — spot checks', () => {
  it('resolves Turmeric → herb', () => {
    expect(resolvePlantType('Turmeric')).toBe('herb');
    expect(resolvePlantType('turmeric')).toBe('herb');
  });

  it('resolves Ginger → herb', () => {
    expect(resolvePlantType('Ginger')).toBe('herb');
  });

  it('resolves Spinach → spinach via alias', () => {
    expect(resolvePlantType('Spinach')).toBe('spinach');
  });

  it('resolves Drumstick → vegetable', () => {
    expect(resolvePlantType('Drumstick')).toBe('vegetable');
  });

  it('resolves Amaranth → vegetable via alias', () => {
    expect(resolvePlantType('Amaranth')).toBe('vegetable');
  });

  it('resolves Black Gram (Urad) → vegetable via alias', () => {
    expect(resolvePlantType('Black Gram (Urad)')).toBe('vegetable');
  });

  it('resolves Pigeon Pea (Arhar) → vegetable via alias', () => {
    expect(resolvePlantType('Pigeon Pea (Arhar)')).toBe('vegetable');
  });

  it('resolves Comfrey → herb via alias', () => {
    expect(resolvePlantType('Comfrey')).toBe('herb');
  });

  it('returns null for genuinely unknown names', () => {
    expect(resolvePlantType('NotARealPlant')).toBeNull();
    expect(resolvePlantType('')).toBeNull();
  });
});

describe('resolvePlantType — all guild template names resolve (not null)', () => {
  const allNames = new Set<string>();

  for (const template of Object.values(GUILD_TEMPLATES)) {
    for (const row of template.plant_rows) {
      allNames.add(row.name);
      for (const companion of row.companion_plants) {
        allNames.add(companion);
      }
    }
  }

  for (const name of allNames) {
    it(`resolves "${name}"`, () => {
      expect(resolvePlantType(name)).not.toBeNull();
    });
  }
});

describe('resolvePlantType — all dynamic accumulator names resolve (not null)', () => {
  for (const acc of DYNAMIC_ACCUMULATORS) {
    it(`resolves "${acc.name}"`, () => {
      expect(resolvePlantType(acc.name)).not.toBeNull();
    });
  }
});

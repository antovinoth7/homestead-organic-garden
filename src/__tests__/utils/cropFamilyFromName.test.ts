/// <reference types="jest" />
import { cropFamilyFromName } from '@/utils/cropFamilyFromName';
import { PLANT_CATALOG_ENTRIES } from '@/config/plantCatalog';
import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';
import { toLookupKey } from '@/utils/plantAliases';

describe('cropFamilyFromName', () => {
  it('returns solanaceae for Tomato', () => {
    expect(cropFamilyFromName('Tomato')).toBe('solanaceae');
  });

  it('returns flower for Marigold', () => {
    expect(cropFamilyFromName('Marigold')).toBe('flower');
  });

  it('is case-insensitive', () => {
    expect(cropFamilyFromName('tomato')).toBe('solanaceae');
    expect(cropFamilyFromName('  TOMATO  ')).toBe('solanaceae');
  });

  it('returns null for a plant nothing knows', () => {
    expect(cropFamilyFromName('Quinoa')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(cropFamilyFromName('')).toBeNull();
  });

  // The family used to come from a scan of guild template rows, so a plant no
  // template mentioned had none — 101 of the 128 rows, including these.
  it('answers for every catalog row, not just the ones a template mentions', () => {
    const unresolved = PLANT_CATALOG_ENTRIES.filter((e) => cropFamilyFromName(e.name) === null);
    expect(unresolved.map((e) => e.name)).toEqual([]);
  });

  it('covers the everyday crops the template scan missed', () => {
    expect(cropFamilyFromName('Onion')).toBe('allium');
    expect(cropFamilyFromName('Garlic')).toBe('allium');
    expect(cropFamilyFromName('Cabbage')).toBe('brassica');
    expect(cropFamilyFromName('Potato')).toBe('solanaceae');
    expect(cropFamilyFromName('Cucumber')).toBe('cucurbit');
  });

  // The old scan compared raw names, so the parenthetical template rows never
  // matched the catalog's plain ones and two headline legumes had no family.
  it('resolves the legumes the parenthetical template rows hid', () => {
    expect(cropFamilyFromName('Black Gram')).toBe('legume');
    expect(cropFamilyFromName('Pigeon Pea')).toBe('legume');
    expect(cropFamilyFromName('Black Gram (Urad)')).toBe('legume');
    expect(cropFamilyFromName('Pigeon Pea (Arhar)')).toBe('legume');
  });

  it('resolves a row through an alternative spelling', () => {
    expect(cropFamilyFromName('Okra')).toBe(cropFamilyFromName('Ladies Finger'));
    expect(cropFamilyFromName('Eggplant')).toBe('solanaceae');
  });

  // Rotation advice is only as good as the family, and these are the ones a
  // grower would not guess: all three are nightshades.
  it('files the medicinal nightshades where rotation needs them', () => {
    expect(cropFamilyFromName('Manathakkali Keerai')).toBe('solanaceae');
    expect(cropFamilyFromName('Thoothuvalai')).toBe('solanaceae');
    expect(cropFamilyFromName('Ashwagandha')).toBe('solanaceae');
  });

  it('files the nitrogen-fixing keerai as legumes', () => {
    expect(cropFamilyFromName('Agathi')).toBe('legume');
    expect(cropFamilyFromName('Fenugreek')).toBe('legume');
  });

  // Two sources for one fact only works while they agree. The record wins; this
  // catches a template row drifting away from it.
  it('agrees with every guild template row that names a catalog plant', () => {
    const byName = new Map(PLANT_CATALOG_ENTRIES.map((e) => [toLookupKey(e.name), e.cropFamily]));
    const conflicts: string[] = [];

    for (const template of Object.values(GUILD_TEMPLATES)) {
      for (const row of template.plant_rows) {
        const fromRecord = byName.get(toLookupKey(row.name));
        if (fromRecord && fromRecord !== row.crop_family) {
          conflicts.push(`${row.name}: template ${row.crop_family} vs record ${fromRecord}`);
        }
      }
    }

    expect(conflicts).toEqual([]);
  });
});

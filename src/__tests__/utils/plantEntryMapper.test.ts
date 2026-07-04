import { mapPlantEntriesToRowInputs, templateRowToCandidate } from '@/utils/plantEntryMapper';
import { GUILD_TEMPLATES, getGuildTemplate } from '@/config/beds/guildTemplates';
import type { PlantEntry } from '@/types/database.types';

function entryFor(name: string, layer: PlantEntry['layer'], spacingCm: number): PlantEntry {
  return { id: 'e1', name, layer, spacingCm };
}

describe('templateRowToCandidate', () => {
  it('carries row_gap_cm and full metadata for every template row', () => {
    for (const template of Object.values(GUILD_TEMPLATES)) {
      for (const row of template.plant_rows) {
        const candidate = templateRowToCandidate(row);
        expect(candidate.name).toBe(row.name);
        expect(candidate.layer).toBe(row.layer);
        expect(candidate.spacingCm).toBe(row.spacing_cm);
        expect(candidate.rowGapCm).toBe(row.row_gap_cm);
        expect(candidate.cropFamily).toBe(row.crop_family);
        expect(candidate.isCompanion).toBe(row.is_companion);
      }
    }
  });

  it('matches mapPlantEntriesToRowInputs field-for-field (Step 4 probe ≡ Step 5 layout input)', () => {
    // A capacity probe built from the candidate must equal what the layout
    // engine receives for a placed entry of the same species — otherwise
    // Step 4's "fits" verdict diverges from Step 5's actual packing.
    for (const template of Object.values(GUILD_TEMPLATES)) {
      for (const row of template.plant_rows) {
        const [mapped] = mapPlantEntriesToRowInputs(
          [entryFor(row.name, row.layer, row.spacing_cm)],
          template
        );
        expect(mapped).toEqual({ ...templateRowToCandidate(row), id: 'e1' });
      }
    }
  });
});

describe('mapPlantEntriesToRowInputs', () => {
  const template = getGuildTemplate('leafy');

  it('classifies suggested companions (companion_plants names) as isCompanion', () => {
    const suggested = template.plant_rows.flatMap((r) => r.companion_plants);
    const external = suggested.find((n) => !template.plant_rows.some((r) => r.name === n));
    expect(external).toBeDefined();
    const [mapped] = mapPlantEntriesToRowInputs(
      [entryFor(external!, 'ground_cover', 25)],
      template
    );
    expect(mapped).toEqual({
      id: 'e1',
      name: external,
      layer: 'ground_cover',
      spacingCm: 25,
      isCompanion: true,
    });
  });

  it('passes unknown names through with only the basic fields (soil builders, My Plants)', () => {
    const name = 'Unknown Test Plant';
    expect(template.plant_rows.some((r) => r.name === name)).toBe(false);
    const [mapped] = mapPlantEntriesToRowInputs([entryFor(name, 'understory', 60)], template);
    expect(mapped).toEqual({ id: 'e1', name, layer: 'understory', spacingCm: 60 });
  });

  it('handles a null template by passing entries through untouched', () => {
    const [mapped] = mapPlantEntriesToRowInputs([entryFor('Amaranth', 'understory', 20)], null);
    expect(mapped).toEqual({ id: 'e1', name: 'Amaranth', layer: 'understory', spacingCm: 20 });
  });
});

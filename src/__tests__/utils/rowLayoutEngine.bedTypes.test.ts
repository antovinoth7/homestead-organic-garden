import {
  computeRowLayout,
  computeInterleavedEastPositions,
  computePlantsPerRow,
  effectiveRowGapCm,
  maxFitForSpecies,
  EXPECTED_LAYERS_BY_BED,
} from '@/utils/rowLayoutEngine';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';
import { mapPlantEntriesToRowInputs, templateRowToCandidate } from '@/utils/plantEntryMapper';
import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';
import type { PlantRow } from '@/config/beds/guildTemplates';
import { LAYER_ORDER } from '@/config/beds/layerMeta';
import type { BedLayer, BedType, PlantEntry } from '@/types/database.types';

const W = 1.2;
const L = 3.0;

function p(
  name: string,
  layer: BedLayer,
  spacingCm: number,
  overrides?: Partial<RowPlantInput>
): RowPlantInput {
  return { name, layer, spacingCm, ...overrides };
}

const layerRank = (l: BedLayer): number => LAYER_ORDER.indexOf(l);

describe('computeRowLayout — bed-type placement audit', () => {
  describe('row index assignment', () => {
    it('rowIndex starts at 1 and is contiguous N→S', () => {
      const plants = [
        p('Maize', 'canopy', 30),
        p('Beans', 'climber', 30),
        p('Pumpkin', 'ground_cover', 60),
      ];
      const result = computeRowLayout(plants, W, L, 'three_sisters');
      const indices = result.rows.map((r) => r.rowIndex);
      expect(indices[0]).toBe(1);
      indices.forEach((idx, i) => {
        if (i > 0) expect(idx).toBe((indices[i - 1] ?? 0) + 1);
      });
    });

    it('rows are ordered N→S by LAYER_ORDER (canopy first, ground_cover last)', () => {
      const plants = [
        p('Pumpkin', 'ground_cover', 60),
        p('Maize', 'canopy', 30),
        p('Beans', 'climber', 30),
      ];
      const result = computeRowLayout(plants, W, L, 'three_sisters');
      const ranks = result.rows.map((r) => layerRank(r.layer));
      ranks.forEach((rank, i) => {
        if (i > 0) expect(rank).toBeGreaterThanOrEqual(ranks[i - 1] ?? 0);
      });
    });
  });

  describe('main plant slot math', () => {
    it('main count per row never exceeds plantsPerRow', () => {
      const plants = [
        p('Tomato', 'understory', 45),
        p('Brinjal', 'understory', 45),
        p('Ladies Finger', 'understory', 45),
      ];
      const result = computeRowLayout(plants, W, L);
      for (const row of result.rows) {
        const mains = row.plants.filter((pl) => pl.isCompanion !== true);
        expect(mains.length).toBeLessThanOrEqual(row.plantsPerRow);
      }
    });

    it('main eastPositionsCm[i] = edgeBuffer + i × spacing', () => {
      const plants = [p('Brinjal', 'understory', 60), p('Brinjal', 'understory', 60)];
      const result = computeRowLayout(plants, W, L);
      const row = result.rows[0]!;
      const spacing = row.plants[0]!.spacingCm;
      for (let i = 1; i < row.eastPositionsCm.length; i++) {
        const delta = row.eastPositionsCm[i]! - row.eastPositionsCm[i - 1]!;
        expect(delta).toBeCloseTo(spacing, 5);
      }
    });
  });

  describe('companion interleaving — visual east positions', () => {
    it('interior companions sit between adjacent mains', () => {
      // 3 mains + 2 companions: companions land in the 2 interior gaps
      const plants = [
        p('Brinjal', 'understory', 30),
        p('Brinjal', 'understory', 30),
        p('Brinjal', 'understory', 30),
        p('Basil', 'understory', 15, { isCompanion: true }),
        p('Basil', 'understory', 15, { isCompanion: true }),
      ];
      const result = computeRowLayout(plants, W, L);
      const row = result.rows[0]!;
      const positions = computeInterleavedEastPositions(row);
      const mainsCount = row.plants.filter((pl) => pl.isCompanion !== true).length;
      // First mainsCount positions are the mains themselves.
      const mainPositions = positions.slice(0, mainsCount);
      const companionPositions = positions.slice(mainsCount);
      for (const cp of companionPositions) {
        // Each companion is between some pair of mains
        const inGap = mainPositions.some(
          (m, i) => i < mainPositions.length - 1 && cp > m && cp < mainPositions[i + 1]!
        );
        expect(inGap).toBe(true);
      }
    });

    it('companion-only row falls back to the slot grid', () => {
      const plants = [
        p('Marigold', 'ground_cover', 30, { isCompanion: true }),
        p('Marigold', 'ground_cover', 30, { isCompanion: true }),
      ];
      const result = computeRowLayout(plants, W, L);
      const row = result.rows[0]!;
      const positions = computeInterleavedEastPositions(row);
      expect(positions.length).toBe(row.plants.length);
      // Positions should be monotonically increasing across the bed.
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i]!).toBeGreaterThan(positions[i - 1]!);
      }
    });
  });

  describe('bed-type category selection', () => {
    it('bed types honor construction_type=in_ground (min 40 cm row gap)', () => {
      const plants = [p('Spinach', 'understory', 25), p('Spinach', 'understory', 25)];
      const result = computeRowLayout(plants, W, L, 'leafy', 'in_ground');
      for (const row of result.rows) {
        expect(row.rowSpacingCm).toBeGreaterThanOrEqual(40);
      }
    });

    it('default construction_type is raised (min 25 cm row gap)', () => {
      const plants = [p('Spinach', 'understory', 20), p('Spinach', 'understory', 20)];
      const result = computeRowLayout(plants, W, L, 'leafy');
      for (const row of result.rows) {
        expect(row.rowSpacingCm).toBeGreaterThanOrEqual(25);
      }
    });
  });

  describe('northEdgeCm second-pass math', () => {
    it('adjacent rows differ by max(rowSpacing[i], rowSpacing[i+1])', () => {
      const plants = [
        p('Tomato', 'understory', 60),
        p('Tomato', 'understory', 60),
        p('Tomato', 'understory', 60),
        p('Tomato', 'understory', 60),
      ];
      const result = computeRowLayout(plants, W, L);
      for (let i = 0; i < result.rows.length - 1; i++) {
        const a = result.rows[i]!;
        const b = result.rows[i + 1]!;
        const expectedGap = Math.max(a.rowSpacingCm, b.rowSpacingCm);
        expect(b.northEdgeCm - a.northEdgeCm).toBe(expectedGap);
      }
    });
  });

  describe('expected layers per bed type', () => {
    const cases: [BedType, BedLayer][] = [
      ['three_sisters', 'canopy'],
      ['three_sisters', 'climber'],
      ['three_sisters', 'ground_cover'],
      ['climber_trellis', 'climber'],
      ['leafy', 'understory'],
      ['leafy', 'ground_cover'],
      ['fruiting', 'climber'],
      ['fruiting', 'understory'],
      ['spice', 'understory'],
      ['spice', 'root'],
      ['root_legume', 'understory'],
      ['root_legume', 'root'],
      ['medicinal_guild', 'canopy'],
      ['medicinal_guild', 'ground_cover'],
    ];
    it.each(cases)('EXPECTED_LAYERS_BY_BED[%s] includes %s', (bedType, layer) => {
      expect(EXPECTED_LAYERS_BY_BED[bedType]).toContain(layer);
    });
  });

  describe('climber_trellis trellis row', () => {
    it('emits at least one climber row when climber plants are given', () => {
      const plants = [
        p('Bitter Gourd', 'climber', 60),
        p('Bitter Gourd', 'climber', 60),
      ];
      const result = computeRowLayout(plants, W, L, 'climber_trellis');
      expect(result.rows.some((r) => r.layer === 'climber')).toBe(true);
    });
  });

  describe('overflow detection', () => {
    it('flags overflow when bed length cannot fit the rows', () => {
      const plants = [
        p('Banana', 'canopy', 200),
        p('Banana', 'canopy', 200),
        p('Banana', 'canopy', 200),
      ];
      const result = computeRowLayout(plants, 2.0, 1.0, 'medicinal_guild');
      expect(result.fitsInBed).toBe(false);
      expect(result.overflowCm).toBeGreaterThan(0);
    });
  });
});

// ── Step 4 capacity ↔ Step 5 layout parity ─────────────────────────────────
// The wizard's "Bed full" engine (maxFitForSpecies) and the Arrange step's
// layout (computeRowLayout over mapped plant entries) must agree for every
// guild template crop under both construction types: the reported max fits,
// and one more overflows.

const MAX_FIT_HARD_CAP = 200; // mirror of the engine's internal probe cap

function entriesFor(row: PlantRow, n: number): PlantEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${row.name}-${i}`,
    name: row.name,
    layer: row.layer,
    spacingCm: row.spacing_cm,
  }));
}

describe('Step 4 capacity ↔ Step 5 layout parity (all bed types × construction)', () => {
  const constructions = ['raised', 'in_ground'] as const;

  for (const [bedType, template] of Object.entries(GUILD_TEMPLATES)) {
    for (const construction of constructions) {
      it(`${bedType} / ${construction}: maxFit fits in Step 5 and maxFit+1 overflows`, () => {
        for (const row of template.plant_rows) {
          const candidate = templateRowToCandidate(row);
          const n = maxFitForSpecies(
            candidate,
            [],
            W,
            L,
            template.type,
            construction
          );
          if (n === 0) continue; // species too big for this bed — nothing to lay out

          const fitAtMax = computeRowLayout(
            mapPlantEntriesToRowInputs(entriesFor(row, n), template),
            W,
            L,
            template.type,
            construction
          );
          expect(fitAtMax.fitsInBed).toBe(true);

          // n+1 must overflow — unless n was clamped by the probe cap rather
          // than by bed geometry.
          const ppr = computePlantsPerRow(Math.round(W * 100), row.spacing_cm);
          const maxRowsCap = Math.max(
            1,
            Math.floor(Math.round(L * 100) / effectiveRowGapCm(candidate, construction))
          );
          const cap = Math.min(MAX_FIT_HARD_CAP, Math.max(ppr * maxRowsCap, 1));
          if (n < cap) {
            const overMax = computeRowLayout(
              mapPlantEntriesToRowInputs(entriesFor(row, n + 1), template),
              W,
              L,
              template.type,
              construction
            );
            expect(overMax.fitsInBed).toBe(false);
          }
        }
      });
    }
  }

  it('probe candidate carries row_gap_cm — omitting it over-estimates capacity (regression)', () => {
    // Any template row whose explicit N-S gap exceeds its spacing exposes the
    // bug: a probe without rowGapCm packs rows tighter than Step 5 lays them.
    const wide = Object.values(GUILD_TEMPLATES)
      .flatMap((t) => t.plant_rows.map((r) => ({ template: t, row: r })))
      .find(
        ({ row }) =>
          row.is_companion !== true && (row.row_gap_cm ?? 0) > Math.max(row.spacing_cm, 25)
      );
    expect(wide).toBeDefined();
    const { template, row } = wide!;

    const withGap = templateRowToCandidate(row);
    const { rowGapCm: _omitted, ...withoutGap } = withGap;
    const nAccurate = maxFitForSpecies(withGap, [], W, L, template.type, 'raised');
    const nNaive = maxFitForSpecies(withoutGap, [], W, L, template.type, 'raised');
    expect(nNaive).toBeGreaterThan(nAccurate);

    // Step 5 rejects the naive count: laying out nNaive real entries overflows.
    const layout = computeRowLayout(
      mapPlantEntriesToRowInputs(entriesFor(row, nNaive), template),
      W,
      L,
      template.type,
      'raised'
    );
    expect(layout.fitsInBed).toBe(false);
  });

  it('companion and soil-builder additions at maxFit still fit a seeded bed', () => {
    const template = GUILD_TEMPLATES.leafy;
    const anchor = template.plant_rows[0]!;
    const seeded = mapPlantEntriesToRowInputs(
      entriesFor(anchor, computePlantsPerRow(Math.round(W * 100), anchor.spacing_cm)),
      template
    );

    // Suggested companion (ground cover, interplants into gaps)
    const companion: RowPlantInput = {
      name: 'Radish',
      layer: 'ground_cover',
      spacingCm: 25,
      isCompanion: true,
    };
    const nComp = maxFitForSpecies(companion, seeded, W, L, template.type, 'raised');
    const comps: RowPlantInput[] = Array.from({ length: nComp }, (_, i) => ({
      ...companion,
      id: `c${i}`,
    }));
    expect(computeRowLayout([...seeded, ...comps], W, L, template.type, 'raised').fitsInBed).toBe(
      true
    );

    // Soil builder (dynamic accumulator defaults: understory, 60 cm)
    const accumulator: RowPlantInput = { name: 'Agathi', layer: 'understory', spacingCm: 60 };
    const nAcc = maxFitForSpecies(accumulator, seeded, W, L, template.type, 'raised');
    const accs: RowPlantInput[] = Array.from({ length: nAcc }, (_, i) => ({
      ...accumulator,
      id: `a${i}`,
    }));
    expect(computeRowLayout([...seeded, ...accs], W, L, template.type, 'raised').fitsInBed).toBe(
      true
    );
  });
});

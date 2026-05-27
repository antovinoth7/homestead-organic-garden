import {
  computeRowLayout,
  computeInterleavedEastPositions,
} from '@/utils/rowLayoutEngine';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';
import { EXPECTED_LAYERS_BY_BED } from '@/utils/rowLayoutEngine';
import { LAYER_ORDER } from '@/config/beds/layerMeta';
import type { BedLayer, BedType } from '@/types/database.types';

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
    it('coconut_intercrop forces food_forest spacing (min 60 cm row gap)', () => {
      const plants = [
        p('Black Pepper', 'climber', 30),
        p('Black Pepper', 'climber', 30),
      ];
      // Even with construction_type='raised', coconut must use food_forest rules.
      const result = computeRowLayout(plants, 3.0, 6.0, 'coconut_intercrop', 'raised');
      for (const row of result.rows) {
        expect(row.rowSpacingCm).toBeGreaterThanOrEqual(60);
      }
    });

    it('non-coconut bed types honor construction_type=in_ground (min 40 cm row gap)', () => {
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
    const cases: Array<[BedType, BedLayer]> = [
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
      ['coconut_intercrop', 'climber'],
      ['coconut_intercrop', 'understory'],
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

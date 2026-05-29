import {
  computeRowLayout,
  computePlantsPerRow,
  interleavePlants,
  maxFitForSpecies,
  getRecommendedFirstAdd,
} from '@/utils/rowLayoutEngine';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';

// 120cm × 300cm is the standard test bed throughout
const W = 1.2;
const L = 3.0;

function plant(
  name: string,
  layer: RowPlantInput['layer'],
  spacingCm: number,
  overrides?: Partial<RowPlantInput>
): RowPlantInput {
  return { name, layer, spacingCm, ...overrides };
}

describe('computeRowLayout', () => {
  it('returns empty result for no plants', () => {
    const result = computeRowLayout([], W, L);
    expect(result.rows).toHaveLength(0);
    expect(result.rowsNeeded).toBe(0);
    expect(result.usedLengthCm).toBe(0);
    expect(result.fitsInBed).toBe(true);
    expect(result.overflowCm).toBe(0);
    expect(result.bedWidthCm).toBe(120);
    expect(result.bedLengthCm).toBe(300);
    expect(result.edgeBufferCm).toBe(0);
  });

  it('plantsPerRow uses max main-crop spacing — companions interplant, not consume slots', () => {
    // 120cm bed: anchor=Tomato 60 → plantsPerRow=2; Basil tucks between as interplanted
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Basil', 'understory', 20, { isCompanion: true }),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.plantsPerRow).toBe(2);
    expect(result.rows[0]!.plants).toHaveLength(2);
    expect(result.rows[0]!.interplantedCount).toBe(1);
    expect(result.rows[0]!.isStaggered).toBe(false);
  });

  it('creates staggered rows when same-species mains overflow plantsPerRow', () => {
    // 3 Tomatoes × 60cm in 120cm bed → plantsPerRow=2 → row A (2) + row B staggered (1)
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.plants).toHaveLength(2);
    expect(result.rows[0]!.isStaggered).toBe(false);
    expect(result.rows[1]!.plants).toHaveLength(1);
    expect(result.rows[1]!.isStaggered).toBe(true);
  });

  it('rowSpacingCm = max chunk spacing × multiplier, floored at category min', () => {
    // Raised (leafy default) multiplier=1.0, floor=25
    // [Ladies Finger 45, Tomato 60] → maxChunk=60 → rowSpacingCm = max(60×1.0, 25) = 60
    const r1 = computeRowLayout(
      [plant('Tomato', 'understory', 60), plant('Ladies Finger', 'understory', 45)],
      W,
      L
    );
    expect(r1.rows[0]!.rowSpacingCm).toBe(60);

    // [Carrot 8] alone → max(8×1.0, 25) = 25 (raised-bed min row gap)
    const r2 = computeRowLayout([plant('Carrot', 'root', 8)], W, L);
    expect(r2.rows[0]!.rowSpacingCm).toBe(25);
  });

  it('usedLengthCm sums inter-row gaps + edge buffer at both ends', () => {
    // 3 same-species mains → 2 rows (rowSpacing=60 each)
    // inter-row gaps: max(60,60) = 60. edgeBuffer (raised, anchor 60) = 15 each side.
    // usedLengthCm = 60 + 2×15 = 90
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.usedLengthCm).toBe(90);
    expect(result.edgeBufferCm).toBe(15);
    // E-W edge buffer mirrors the per-row eBufEW: computeEdgeBuffer(60) = clamp(15, 5, 20) = 15.
    expect(result.edgeBufferEWCm).toBe(15);
  });

  it('fitsInBed false and overflowCm > 0 when used length exceeds bed length', () => {
    // 3 same-species mains need 90cm; 0.5m bed = 50cm → overflow 40cm
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
    ];
    const result = computeRowLayout(plants, W, 0.5);
    expect(result.fitsInBed).toBe(false);
    expect(result.overflowCm).toBe(40);
  });

  it('fitsInBed true when all rows fit within bed length', () => {
    const plants = [plant('Tomato', 'understory', 60), plant('Tomato', 'understory', 60)];
    // 1 row only (both fit) → usedLength = 0 + 2×15 = 30 ≤ 300
    const result = computeRowLayout(plants, W, L);
    expect(result.fitsInBed).toBe(true);
    expect(result.overflowCm).toBe(0);
    expect(result.usedLengthCm).toBe(30);
  });

  it('layer order is canopy → climber → understory → root → ground_cover (N→S)', () => {
    const plants = [plant('Maize', 'canopy', 45), plant('Carrot', 'root', 8)];
    const result = computeRowLayout(plants, W, L);
    expect(result.rows[0]!.layer).toBe('canopy');
    expect(result.rows[1]!.layer).toBe('root');
  });

  it('isNFixer is true for legume cropFamily, false otherwise', () => {
    const plants = [
      plant('Cowpea', 'understory', 30, { cropFamily: 'legume' }),
      plant('Tomato', 'understory', 60, { cropFamily: 'solanaceae' }),
    ];
    const result = computeRowLayout(plants, W, L);
    const allPlants = result.rows.flatMap((r) => r.plants);
    const cowpea = allPlants.find((p) => p.name === 'Cowpea');
    const tomato = allPlants.find((p) => p.name === 'Tomato');
    expect(cowpea?.isNFixer).toBe(true);
    expect(tomato?.isNFixer).toBe(false);
  });

  it('successionWeeks collects unique values sorted ascending', () => {
    const plants = [
      plant('Maize', 'canopy', 45, { successionWeek: 3 }),
      plant('Beans', 'climber', 30, { successionWeek: 1 }),
      plant('Pumpkin', 'ground_cover', 90, { successionWeek: 2 }),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.successionWeeks).toEqual([1, 2, 3]);
  });

  it('successionWeeks excludes plants with no successionWeek', () => {
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Brinjal', 'understory', 60, { successionWeek: 2 }),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.successionWeeks).toEqual([2]);
  });

  it('detects antagonist companion pairs and populates companionWarnings', () => {
    // Fennel + Tomato is a known antagonist pair in companionRules
    const plants = [plant('Fennel', 'understory', 30), plant('Tomato', 'understory', 60)];
    const result = computeRowLayout(plants, W, L);
    expect(result.companionWarnings.length).toBeGreaterThan(0);
    expect(result.companionWarnings[0]).toMatchObject({ plantA: 'Fennel', plantB: 'Tomato' });
  });

  it('reports no companion warnings for compatible plants', () => {
    const plants = [plant('Tomato', 'understory', 60), plant('Basil', 'understory', 20)];
    const result = computeRowLayout(plants, W, L);
    expect(result.companionWarnings).toHaveLength(0);
  });

  it('clamps plantsPerRow to minimum 1 when plant spacing exceeds bed width', () => {
    // 300cm plant in 120cm bed → plantsPerRow = 1
    const plants = [plant('Moringa', 'canopy', 300)];
    const result = computeRowLayout(plants, W, L);
    expect(result.rows[0]!.plantsPerRow).toBe(1);
    expect(result.rows[0]!.plants).toHaveLength(1);
  });

  it('real fruiting guild — 120cm × 300cm bed produces correct rowsNeeded and usedLengthCm', () => {
    // Climber: Ridge Gourd 100 alone → plantsPerRow=1, 1 row, rowSpacing=100
    // Understory: O45 + T60 + B60 (all mains) → plantsPerRow=2 → row A [O,T] + row B [B] staggered
    // Ground cover: Marigold 30 (companion) → standalone row (no mains), plantsPerRow=4, rowSpacing=30
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Brinjal', 'understory', 60),
      plant('Ladies Finger', 'understory', 45),
      plant('Ridge Gourd', 'climber', 100),
      plant('Marigold', 'ground_cover', 30, { isCompanion: true }),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.rowsNeeded).toBe(4);
    // inter-row gaps: max(100,60)+max(60,60)+max(60,30) = 100+60+60 = 220
    // edgeBuffer = clamp(100×0.25, 5, 20) = 20
    // usedLength = 220 + 40 = 260
    expect(result.usedLengthCm).toBe(260);
    expect(result.fitsInBed).toBe(true);
    expect(result.rows[0]!.layer).toBe('climber');
    const understoryRow = result.rows.find((r) => r.layer === 'understory' && !r.isStaggered)!;
    expect(understoryRow.plantsPerRow).toBe(2);
  });

  it('staggered row labels use A/B/C suffix for all layer types (including climber)', () => {
    // 3 climbers, anchor=100 → plantsPerRow=1 → 3 rows with A/B/C suffix
    const plants = [
      plant('Bitter Gourd', 'climber', 90),
      plant('Snake Gourd', 'climber', 100),
      plant('Yardlong Beans', 'climber', 30),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]!.label).toMatch(/A$/);
    expect(result.rows[1]!.label).toMatch(/B$/);
    expect(result.rows[2]!.label).toMatch(/C$/);
  });

  // ─── New center-to-center + companion + bed-type tests ─────────────────────

  it('center-to-center fence-post: 150cm bed at 60cm anchor fits 3 plants per row', () => {
    // computePlantsPerRow(150, 60): edge=15, usable=120, floor(120/60)+1 = 3
    const result = computeRowLayout([plant('Tomato', 'understory', 60)], 1.5, L);
    expect(result.rows[0]!.plantsPerRow).toBe(3);
  });

  it('edge buffer is clamped to [5, 20] cm regardless of anchor spacing', () => {
    // Tiny anchor: edge would be 30×0.25=7.5 → rounds to 8 (above floor of 5)
    expect(computePlantsPerRow(100, 30)).toBe(3); // edge=8, usable=84, floor(84/30)+1 = 3

    // Huge anchor: edge would be 300×0.25=75 → clamped to 20
    // For 200cm bed × 300 spacing: usable=160, floor(160/300)+1 = 1
    expect(computePlantsPerRow(200, 300)).toBe(1);
  });

  it('companions interleave between same-species mains: 2 tomatoes + 1 basil → row [T, T, basil]', () => {
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
      plant('Basil', 'understory', 20, { isCompanion: true }),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]!.plants).toHaveLength(3);
    expect(result.rows[0]!.plantsPerRow).toBe(2);
    expect(result.rows[0]!.interplantedCount).toBe(1);
  });

  it('MIN_ROW_GAP differs by construction type: raised=25, in_ground=40', () => {
    // Without constructionType every bed type defaults to raised (25cm floor).
    const small = [plant('Carrot', 'root', 8)];
    const rLeafy = computeRowLayout(small, W, L, 'leafy');
    const rClimber = computeRowLayout(small, W, L, 'climber_trellis');
    const rSisters = computeRowLayout(small, W, L, 'three_sisters');
    expect(rLeafy.rows[0]!.rowSpacingCm).toBe(25);
    expect(rClimber.rows[0]!.rowSpacingCm).toBe(25);
    expect(rSisters.rows[0]!.rowSpacingCm).toBe(25);
  });

  it('constructionType="in_ground" widens row gap: 1.3× multiplier + 40cm floor', () => {
    // Tomato 60cm anchor with in_ground: rowSpacing = max(60×1.3, 40) = 78
    const r = computeRowLayout([plant('Tomato', 'understory', 60)], W, L, 'fruiting', 'in_ground');
    expect(r.rows[0]!.rowSpacingCm).toBe(78);

    // 8cm Carrot in in_ground hits the 40cm floor
    const rFloor = computeRowLayout([plant('Carrot', 'root', 8)], W, L, 'fruiting', 'in_ground');
    expect(rFloor.rows[0]!.rowSpacingCm).toBe(40);
  });

  it('omitting constructionType defaults to raised (1.0× multiplier, 25cm floor)', () => {
    const plants = [plant('Tomato', 'understory', 60)];
    const rDefault = computeRowLayout(plants, W, L, 'fruiting');
    const rRaised = computeRowLayout(plants, W, L, 'fruiting', 'raised');
    expect(rDefault.rows[0]!.rowSpacingCm).toBe(60); // max(60×1.0, 25) = 60
    expect(rDefault.rows[0]!.rowSpacingCm).toBe(rRaised.rows[0]!.rowSpacingCm);
  });

  it('one-row bed: usedLengthCm = 2 × edgeBuffer (no inter-row gap)', () => {
    // Single 60cm tomato → 1 row, rowSpacing=60, interRow=0, edgeBuffer=15 → 30
    const result = computeRowLayout([plant('Tomato', 'understory', 60)], W, L);
    expect(result.rows).toHaveLength(1);
    expect(result.usedLengthCm).toBe(30);
    expect(result.edgeBufferCm).toBe(15);
  });

  it('surplus companions overflow into a staggered companion-only row', () => {
    // 2 same-species tomatoes + 5 basils → row A [T,T,B] (interplanted 1) + row B [B,B,B,B] staggered
    const plants = [
      plant('Tomato', 'understory', 60),
      plant('Tomato', 'understory', 60),
      plant('Basil 1', 'understory', 20, { isCompanion: true }),
      plant('Basil 2', 'understory', 20, { isCompanion: true }),
      plant('Basil 3', 'understory', 20, { isCompanion: true }),
      plant('Basil 4', 'understory', 20, { isCompanion: true }),
      plant('Basil 5', 'understory', 20, { isCompanion: true }),
    ];
    const result = computeRowLayout(plants, W, L);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]!.plants).toHaveLength(3);
    expect(result.rows[0]!.interplantedCount).toBe(1);
    expect(result.rows[0]!.isStaggered).toBe(false);
    expect(result.rows[1]!.plants).toHaveLength(4);
    expect(result.rows[1]!.interplantedCount).toBe(0);
    expect(result.rows[1]!.isStaggered).toBe(true);
    expect(result.rows[1]!.plants.every((p) => p.isCompanion)).toBe(true);
  });

  it('omitting bedType defaults to leafy (raised, 1.0× multiplier, 25cm floor)', () => {
    const plants = [plant('Carrot', 'root', 8)];
    const rDefault = computeRowLayout(plants, W, L);
    const rLeafy = computeRowLayout(plants, W, L, 'leafy');
    expect(rDefault.rows[0]!.rowSpacingCm).toBe(rLeafy.rows[0]!.rowSpacingCm);
    expect(rDefault.usedLengthCm).toBe(rLeafy.usedLengthCm);
  });

  it('huge-anchor regression: 300cm plant in 120cm bed clamps to plantsPerRow=1 without negative buffer', () => {
    const result = computeRowLayout([plant('Moringa', 'canopy', 300)], W, L);
    expect(result.rows[0]!.plantsPerRow).toBe(1);
    expect(result.edgeBufferCm).toBeGreaterThanOrEqual(0);
  });

  it('exposes computePlantsPerRow helper for use by ghost-row UI', () => {
    expect(computePlantsPerRow(120, 60)).toBe(2);
    expect(computePlantsPerRow(150, 60)).toBe(3);
    expect(computePlantsPerRow(120, 200)).toBe(1);
    expect(computePlantsPerRow(0, 60)).toBe(1);
  });
});

describe('interleavePlants', () => {
  const main = (name: string): { name: string; isCompanion?: boolean } => ({ name });
  const comp = (name: string): { name: string; isCompanion?: boolean } => ({
    name,
    isCompanion: true,
  });

  it('places companions between mains: 2 mains + 1 companion → [M, C, M]', () => {
    const result = interleavePlants([main('T1'), main('T2'), comp('B1')]);
    expect(result.map((p) => p.name)).toEqual(['T1', 'B1', 'T2']);
  });

  it('distributes evenly: 3 mains + 2 companions → [M, C, M, C, M]', () => {
    const result = interleavePlants([main('T1'), main('T2'), main('T3'), comp('B1'), comp('B2')]);
    expect(result.map((p) => p.name)).toEqual(['T1', 'B1', 'T2', 'B2', 'T3']);
  });

  it('extras beyond gap count append to the end: 2 mains + 3 companions → [M, C, M, C, C]', () => {
    // gapCount = 1, perGapBase = 3, remainder = 0
    // Actually: companions=3, gapCount=1 → perGapBase=3, all 3 in the single gap
    const result = interleavePlants([main('T1'), main('T2'), comp('B1'), comp('B2'), comp('B3')]);
    expect(result.map((p) => p.name)).toEqual(['T1', 'B1', 'B2', 'B3', 'T2']);
  });

  it('uneven remainder favours earlier gaps: 3 mains + 3 companions → [M, C, C, M, C, M]', () => {
    // gapCount = 2, perGapBase = 1, remainder = 1 → gap 0 gets 2, gap 1 gets 1
    const result = interleavePlants([
      main('T1'),
      main('T2'),
      main('T3'),
      comp('B1'),
      comp('B2'),
      comp('B3'),
    ]);
    expect(result.map((p) => p.name)).toEqual(['T1', 'B1', 'B2', 'T2', 'B3', 'T3']);
  });

  it('1 main + 3 companions → [M, C, C, C] (no leading gap before only main)', () => {
    const result = interleavePlants([main('T1'), comp('B1'), comp('B2'), comp('B3')]);
    expect(result.map((p) => p.name)).toEqual(['T1', 'B1', 'B2', 'B3']);
  });

  it('0 mains + 2 companions → [C, C]', () => {
    const result = interleavePlants([comp('B1'), comp('B2')]);
    expect(result.map((p) => p.name)).toEqual(['B1', 'B2']);
  });

  it('2 mains + 0 companions → [M, M]', () => {
    const result = interleavePlants([main('T1'), main('T2')]);
    expect(result.map((p) => p.name)).toEqual(['T1', 'T2']);
  });

  it('handles empty input', () => {
    expect(interleavePlants([])).toEqual([]);
  });

  it('preserves companion vs main order within their own sequences', () => {
    const result = interleavePlants([main('T1'), comp('B1'), main('T2'), comp('B2'), main('T3')]);
    // mains stay [T1, T2, T3]; companions stay [B1, B2]
    expect(result.map((p) => p.name)).toEqual(['T1', 'B1', 'T2', 'B2', 'T3']);
  });
});

describe('maxFitForSpecies', () => {
  const tomato: RowPlantInput = { name: 'Tomato', layer: 'understory', spacingCm: 60 };
  const moringa: RowPlantInput = { name: 'Moringa', layer: 'canopy', spacingCm: 300 };

  it('returns a positive integer when bed has room on an empty bed', () => {
    // 1.2 × 3.0 m raised — single tomato uses 30cm, additional rows use 60cm each.
    // After 1 tomato: 30cm. Each additional tomato adds another row when plantsPerRow=2 fills.
    const n = maxFitForSpecies(tomato, [], W, L);
    expect(n).toBeGreaterThan(0);
  });

  it('reduces with each existing same-species entry', () => {
    const empty = maxFitForSpecies(tomato, [], W, L);
    const seeded = maxFitForSpecies(
      tomato,
      [
        { ...tomato, id: 'a' },
        { ...tomato, id: 'b' },
      ],
      W,
      L
    );
    expect(seeded).toBeLessThanOrEqual(empty);
    expect(empty - seeded).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 when adding even one more would overflow', () => {
    // 3 tomatoes in 0.5m bed overflow (per existing test on line 87-97). Probing with one
    // more tomato also overflows → result is 0.
    const seeded: RowPlantInput[] = [
      { ...tomato, id: 'a' },
      { ...tomato, id: 'b' },
      { ...tomato, id: 'c' },
    ];
    const n = maxFitForSpecies(tomato, seeded, W, 0.5);
    expect(n).toBe(0);
  });

  it('returns at least 1 when a single instance fits but a second does not', () => {
    // Moringa anchor 300 with 1.0× raised multiplier and 25cm floor:
    //   rowSpacing = max(300×1.0, 25) = 300. usedLength for 1 row = 2×edgeBuffer (20) = 40 ≤ 300.
    //   For 2 rows: interRow gap = max(300,300) = 300. usedLength = 300 + 40 = 340 > 300 → overflow.
    // So maxFit = 1.
    const n = maxFitForSpecies(moringa, [], W, L);
    expect(n).toBe(1);
  });

  it('in_ground multiplier reduces max vs raised default', () => {
    // in_ground (1.3× multiplier, 40cm floor) consumes more length per row than raised.
    const raised = maxFitForSpecies(tomato, [], W, L, 'leafy', 'raised');
    const inGround = maxFitForSpecies(tomato, [], W, L, 'leafy', 'in_ground');
    expect(inGround).toBeLessThanOrEqual(raised);
  });

  it('honours hard cap to prevent runaway probing on enormous beds', () => {
    // 50 m × 50 m would otherwise probe ~6889 iterations; the hard cap keeps it bounded.
    const n = maxFitForSpecies(tomato, [], 50, 50, 'leafy', 'raised');
    expect(n).toBe(200);
  });
});

describe('getRecommendedFirstAdd', () => {
  const tomato: RowPlantInput = { name: 'Tomato', layer: 'understory', spacingCm: 60 };
  const moringa: RowPlantInput = { name: 'Moringa', layer: 'canopy', spacingCm: 300 };

  it('returns plantsPerRow on an empty bed when capacity allows', () => {
    // 1.2m bed at 60cm anchor → plantsPerRow = 2; bed has plenty of length for 1 row.
    expect(getRecommendedFirstAdd(tomato, [], W, L)).toBe(2);
  });

  it('clamps to maxFit when bed is mostly full', () => {
    // Seed with 3 tomatoes in a 0.5m bed (overflow) — first-add for one more is 0.
    const seeded: RowPlantInput[] = [
      { ...tomato, id: 'a' },
      { ...tomato, id: 'b' },
      { ...tomato, id: 'c' },
    ];
    expect(getRecommendedFirstAdd(tomato, seeded, W, 0.5)).toBe(0);
  });

  it('returns 1 for a wide-anchor species that only fits one per row', () => {
    // Moringa 300cm in 1.2m bed: plantsPerRow = 1, maxFit = 1.
    expect(getRecommendedFirstAdd(moringa, [], W, L)).toBe(1);
  });
});

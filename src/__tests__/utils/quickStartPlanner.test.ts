import { buildQuickStartPlan } from '@/utils/quickStartPlanner';
import {
  computeRowLayout,
  computePlantsPerRow,
  effectiveRowGapCm,
  maxFitForSpecies,
} from '@/utils/rowLayoutEngine';
import type { RowPlantInput } from '@/utils/rowLayoutEngine';
import { GUILD_TEMPLATES } from '@/config/beds/guildTemplates';
import type { GuildTemplate } from '@/config/beds/guildTemplates';
import type { BedType } from '@/types/database.types';

// Standard default wizard bed.
const W = 1.2;
const L = 3.0;

const ALL_TYPES = Object.keys(GUILD_TEMPLATES) as BedType[];

/** External companion suggestions: companion_plants with no template row of their own. */
function externalCompanions(template: GuildTemplate): string[] {
  const rowNames = new Set(template.plant_rows.map((r) => r.name));
  const out = new Set<string>();
  for (const row of template.plant_rows) {
    for (const c of row.companion_plants) {
      if (!rowNames.has(c)) out.add(c);
    }
  }
  return Array.from(out);
}

describe('buildQuickStartPlan', () => {
  it('accounts for every main, in-template companion, and suggested companion (seated or reported dropped)', () => {
    for (const type of ALL_TYPES) {
      const template = GUILD_TEMPLATES[type];
      const plan = buildQuickStartPlan(template, W, L, type, 'raised');
      const seated = new Set(plan.entries.map((e) => e.name));

      const expected = [
        ...template.plant_rows.map((r) => r.name),
        ...externalCompanions(template),
      ];
      for (const name of expected) {
        // Nothing is ever silently lost: each species is either planted or flagged as dropped.
        expect(seated.has(name) || plan.dropped.includes(name)).toBe(true);
      }
    }
  });

  it('produces a layout that actually fits the bed for every bed type', () => {
    for (const type of ALL_TYPES) {
      const template = GUILD_TEMPLATES[type];
      const plan = buildQuickStartPlan(template, W, L, type, 'raised');
      const inputs: RowPlantInput[] = plan.entries.map((e) => {
        const row = template.plant_rows.find((r) => r.name === e.name);
        return {
          name: e.name,
          layer: e.layer,
          spacingCm: e.spacingCm,
          rowGapCm: row?.row_gap_cm,
          isCompanion: row ? row.is_companion : true,
        };
      });
      expect(computeRowLayout(inputs, W, L, type, 'raised').fitsInBed).toBe(true);
    }
  });

  it('seeds companions for bed types that previously dropped them', () => {
    const climber = buildQuickStartPlan(
      GUILD_TEMPLATES.climber_trellis,
      W,
      L,
      'climber_trellis',
      'raised'
    );
    const climberNames = new Set(climber.entries.map((e) => e.name));
    expect(climberNames.has('Basil')).toBe(true);
    expect(climberNames.has('Carrot')).toBe(true);
    expect(climberNames.has('Marigold')).toBe(true);

    const spice = buildQuickStartPlan(GUILD_TEMPLATES.spice, W, L, 'spice', 'raised');
    const spiceNames = new Set(spice.entries.map((e) => e.name));
    expect(spiceNames.has('Curry Leaf')).toBe(true);
    expect(spiceNames.has('Basil')).toBe(true);
    expect(spiceNames.has('Carrot')).toBe(true);
  });

  it('seats the full Medicinal Guild after the Moringa row-gap fix', () => {
    const plan = buildQuickStartPlan(
      GUILD_TEMPLATES.medicinal_guild,
      W,
      L,
      'medicinal_guild',
      'raised'
    );
    const names = new Set(plan.entries.map((e) => e.name));
    for (const species of ['Moringa', 'Tulsi', 'Aloe Vera', 'Lemongrass', 'Tomato']) {
      expect(names.has(species)).toBe(true);
    }
    expect(plan.dropped).toHaveLength(0);
  });

  it('plants all three Three Sisters crops (its companions ARE its mains)', () => {
    const plan = buildQuickStartPlan(
      GUILD_TEMPLATES.three_sisters,
      W,
      L,
      'three_sisters',
      'raised'
    );
    const names = new Set(plan.entries.map((e) => e.name));
    expect(names.has('Maize')).toBe(true);
    expect(names.has('Beans')).toBe(true);
    expect(names.has('Pumpkin')).toBe(true);
  });

  it('honestly reports species that cannot fit the default bed (fruiting)', () => {
    const plan = buildQuickStartPlan(GUILD_TEMPLATES.fruiting, W, L, 'fruiting', 'raised');
    // 4 understory/climber mains + 3 companions exceed a 1.2x3.0 bed; the planner reports
    // the unavoidable omissions rather than silently dropping them.
    expect(plan.dropped).toContain('Pepper');
    expect(plan.dropped).toContain('Ladies Finger');
  });

  it('seats everything on a larger bed', () => {
    for (const type of ALL_TYPES) {
      const template = GUILD_TEMPLATES[type];
      const plan = buildQuickStartPlan(template, 1.5, 6.0, type, 'in_ground');
      expect(plan.dropped).toHaveLength(0);
    }
  });
});

describe('maxFitForSpecies binary search', () => {
  // Reference O(n) linear probe mirroring the pre-optimisation implementation.
  function linearMaxFit(
    candidate: RowPlantInput,
    current: RowPlantInput[],
    widthM: number,
    lengthM: number,
    bedType: BedType,
    construction?: 'raised' | 'in_ground'
  ): number {
    const bedWidthCm = Math.round(widthM * 100);
    const bedLengthCm = Math.round(lengthM * 100);
    const ppr = computePlantsPerRow(bedWidthCm, candidate.spacingCm);
    const effGap = effectiveRowGapCm(candidate, construction);
    const maxRowsCap = Math.max(1, Math.floor(bedLengthCm / effGap));
    const cap = Math.min(200, Math.max(ppr * maxRowsCap, 1));
    for (let n = 1; n <= cap; n++) {
      const additions = Array.from({ length: n }, (_, i) => ({
        ...candidate,
        id: `${candidate.id ?? candidate.name}_ref_${i}`,
      }));
      if (!computeRowLayout([...current, ...additions], widthM, lengthM, bedType, construction).fitsInBed) {
        return n - 1;
      }
    }
    return cap;
  }

  it('returns identical results to the linear reference across species and bed sizes', () => {
    const beds: { w: number; l: number; c: 'raised' | 'in_ground' }[] = [
      { w: 1.2, l: 3.0, c: 'raised' },
      { w: 0.9, l: 1.5, c: 'raised' },
      { w: 1.5, l: 6.0, c: 'in_ground' },
    ];
    for (const type of ALL_TYPES) {
      const template = GUILD_TEMPLATES[type];
      for (const bed of beds) {
        for (const row of template.plant_rows) {
          const candidate: RowPlantInput = {
            name: row.name,
            layer: row.layer,
            spacingCm: row.spacing_cm,
            rowGapCm: row.row_gap_cm,
            isCompanion: row.is_companion,
          };
          const expected = linearMaxFit(candidate, [], bed.w, bed.l, type, bed.c);
          const actual = maxFitForSpecies(candidate, [], bed.w, bed.l, type, bed.c);
          expect(actual).toBe(expected);
        }
      }
    }
  });
});

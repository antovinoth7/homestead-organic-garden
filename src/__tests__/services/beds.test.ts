import { getHarvestGapWarnings, getCrossBedStatus, normalizeBed } from '@/services/bedLogic';
import { Plant } from '@/types/database.types';
import { makeBed } from '../fixtures/bed.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';

describe('beds service — pure logic', () => {
  describe('getHarvestGapWarnings', () => {
    it('returns no warnings for an empty bed list', () => {
      expect(getHarvestGapWarnings([])).toEqual([]);
    });

    it('flags both beds when two share the same type', () => {
      const a = makeBed({ id: 'bed-a', type: 'leafy' });
      const b = makeBed({ id: 'bed-b', type: 'leafy' });

      const warnings = getHarvestGapWarnings([a, b]);

      expect(warnings).toHaveLength(2);
      expect(warnings.map((w) => w.bed_id).sort()).toEqual(['bed-a', 'bed-b']);
      warnings.forEach((w) => expect(w.category).toBe('leafy'));
    });

    it('does not flag a type that has only one bed', () => {
      const leafy = makeBed({ id: 'bed-a', type: 'leafy' });
      const fruiting = makeBed({ id: 'bed-b', type: 'fruiting' });

      expect(getHarvestGapWarnings([leafy, fruiting])).toEqual([]);
    });

    it('isolates warnings per type when several types are present', () => {
      const beds = [
        makeBed({ id: 'l1', type: 'leafy' }),
        makeBed({ id: 'l2', type: 'leafy' }),
        makeBed({ id: 'f1', type: 'fruiting' }),
      ];

      const warnings = getHarvestGapWarnings(beds);

      expect(warnings).toHaveLength(2);
      expect(warnings.every((w) => w.category === 'leafy')).toBe(true);
    });
  });

  describe('getCrossBedStatus', () => {
    it('computes legume coverage from the bed plant set', () => {
      const bed = makeBed({ id: 'bed-1' });
      const plantsByBedId: Record<string, Plant[]> = {
        'bed-1': [
          makePlant({ id: 'p1', crop_family: 'legume' }),
          makePlant({ id: 'p2', crop_family: 'solanaceae' }),
        ],
      };

      const status = getCrossBedStatus([bed], plantsByBedId)[0]!;

      expect(status.bed_id).toBe('bed-1');
      expect(status.legume_coverage_pct).toBe(50);
    });

    it('reports 0% coverage for a bed with no plants', () => {
      const bed = makeBed({ id: 'bed-1' });

      const status = getCrossBedStatus([bed], {})[0]!;

      expect(status.legume_coverage_pct).toBe(0);
    });

    it('flags a solanaceae violation from prev_crop_family', () => {
      const violating = makeBed({ id: 'bed-1', prev_crop_family: 'solanaceae' });
      const clean = makeBed({ id: 'bed-2', prev_crop_family: 'legume' });

      const statuses = getCrossBedStatus([violating, clean], {});

      expect(statuses[0]!.has_solanaceae_violation).toBe(true);
      expect(statuses[1]!.has_solanaceae_violation).toBe(false);
    });

    it('populates the checklist and green-manure recommendation', () => {
      const bed = makeBed({ id: 'bed-1' });

      const status = getCrossBedStatus([bed], {})[0]!;

      expect(Array.isArray(status.coordinator_checklist)).toBe(true);
      expect(status.coordinator_checklist.length).toBeGreaterThan(0);
      expect(status.green_manure_recommendation?.name).toBeTruthy();
    });

    it('attaches only this bed’s harvest-gap warnings', () => {
      const a = makeBed({ id: 'bed-a', type: 'leafy' });
      const b = makeBed({ id: 'bed-b', type: 'leafy' });

      const statuses = getCrossBedStatus([a, b], {});

      statuses.forEach((status) => {
        expect(status.harvest_gap_warnings).toHaveLength(1);
        expect(status.harvest_gap_warnings[0]!.bed_id).toBe(status.bed_id);
      });
    });
  });

  describe('normalizeBed', () => {
    it('applies defaults for missing fields', () => {
      const bed = normalizeBed('bed-1', { user_id: 'u1', name: 'Bare Bed' });

      expect(bed.id).toBe('bed-1');
      expect(bed.type).toBe('leafy');
      expect(bed.dimensions).toEqual({ width_m: 1.2, length_m: 3, area_sqm: 3.6 });
      expect(bed.sunlight).toBe('full_sun');
      expect(bed.soil_type).toBe('garden_soil');
      expect(bed.pest_history).toEqual([]);
      expect(bed.is_deleted).toBe(false);
    });

    it('passes through provided values unchanged', () => {
      const bed = normalizeBed('bed-2', {
        user_id: 'u1',
        name: 'Custom Bed',
        type: 'fruiting',
        dimensions: { width_m: 1, length_m: 2, area_sqm: 2 },
        is_deleted: true,
      });

      expect(bed.type).toBe('fruiting');
      expect(bed.dimensions).toEqual({ width_m: 1, length_m: 2, area_sqm: 2 });
      expect(bed.is_deleted).toBe(true);
    });

    it('converts timestamps to ISO strings', () => {
      const bed = normalizeBed('bed-3', {
        user_id: 'u1',
        name: 'Dated Bed',
        created_at: '2026-03-15T00:00:00.000Z',
      });

      expect(bed.created_at).toBe('2026-03-15T00:00:00.000Z');
      // Missing updated_at falls back to a valid ISO timestamp.
      expect(Number.isNaN(Date.parse(bed.updated_at))).toBe(false);
    });
  });
});

import {
  summarizeHarvests,
  groupHarvestsBySeason,
  groupHarvestsByTree,
  computeHarvestsReady,
  isHarvestJournalEntry,
} from '@/utils/harvestStats';
import type { JournalEntry } from '@/types/database.types';
import { JournalEntryType } from '@/types/database.types';
import { makeJournalEntry } from '../fixtures/journal.fixtures';
import { makePlant } from '../fixtures/plant.fixtures';
import { makeTaskTemplate } from '../fixtures/task.fixtures';

describe('harvestStats', () => {
  describe('isHarvestJournalEntry', () => {
    it('accepts a harvest entry', () => {
      expect(
        isHarvestJournalEntry(makeJournalEntry({ entry_type: JournalEntryType.Harvest }))
      ).toBe(true);
    });

    it('rejects other entry types', () => {
      for (const type of [
        JournalEntryType.Observation,
        JournalEntryType.PestDisease,
        JournalEntryType.Issue,
        JournalEntryType.Milestone,
        JournalEntryType.Other,
      ]) {
        expect(isHarvestJournalEntry(makeJournalEntry({ entry_type: type }))).toBe(false);
      }
    });

    it('rejects an entry with no entry_type at all', () => {
      // This pins the claim that moving the harvest filter server-side changes
      // nothing: a Firestore `where('entry_type','==',...)` never matches a
      // document missing the field, and neither does this predicate. A legacy
      // document without the field was already excluded client-side.
      expect(isHarvestJournalEntry({} as JournalEntry)).toBe(false);
      expect(isHarvestJournalEntry({ entry_type: undefined } as unknown as JournalEntry)).toBe(
        false
      );
    });
  });

  describe('summarizeHarvests', () => {
    it('returns zeros and a default unit for no entries', () => {
      const s = summarizeHarvests([]);
      expect(s).toEqual({ count: 0, total: 0, average: 0, unit: 'units' });
    });

    it('totals and averages quantities, picking up the unit', () => {
      const entries = [
        makeJournalEntry({ id: 'a', harvest_quantity: 4, harvest_unit: 'kg' }),
        makeJournalEntry({ id: 'b', harvest_quantity: 6, harvest_unit: 'kg' }),
      ];
      const s = summarizeHarvests(entries);
      expect(s.count).toBe(2);
      expect(s.total).toBe(10);
      expect(s.average).toBe(5);
      expect(s.unit).toBe('kg');
    });
  });

  describe('groupHarvestsBySeason', () => {
    it('buckets quantity by season in calendar order, omitting empty seasons', () => {
      const entries = [
        makeJournalEntry({ id: '1', harvest_quantity: 2, created_at: '2026-04-15T12:00:00.000Z' }), // summer
        makeJournalEntry({ id: '2', harvest_quantity: 3, created_at: '2026-07-15T12:00:00.000Z' }), // sw_monsoon
        makeJournalEntry({ id: '3', harvest_quantity: 1, created_at: '2026-07-20T12:00:00.000Z' }), // sw_monsoon
      ];
      const buckets = groupHarvestsBySeason(entries);
      expect(buckets.map((b) => b.key)).toEqual(['summer', 'sw_monsoon']);
      expect(buckets.find((b) => b.key === 'sw_monsoon')?.total).toBe(4);
    });

    it('returns no buckets for no entries', () => {
      expect(groupHarvestsBySeason([])).toEqual([]);
    });
  });

  describe('groupHarvestsByTree', () => {
    it('groups by tree number, ignores entries without one, sorts ascending', () => {
      const entries = [
        makeJournalEntry({ id: '1', harvest_quantity: 5, harvest_tree_number: 2 }),
        makeJournalEntry({ id: '2', harvest_quantity: 3, harvest_tree_number: 1 }),
        makeJournalEntry({ id: '3', harvest_quantity: 4, harvest_tree_number: 1 }),
        makeJournalEntry({ id: '4', harvest_quantity: 9 }), // no tree number → ignored
      ];
      const trees = groupHarvestsByTree(entries);
      expect(trees.map((t) => t.treeNumber)).toEqual([1, 2]);
      expect(trees[0]).toEqual({ treeNumber: 1, total: 7, count: 2 });
      expect(trees[1]).toEqual({ treeNumber: 2, total: 5, count: 1 });
    });

    it('returns empty when no entries carry a tree number', () => {
      expect(groupHarvestsByTree([makeJournalEntry({ harvest_quantity: 1 })])).toEqual([]);
    });
  });

  describe('computeHarvestsReady', () => {
    const NOW = new Date('2026-08-22T06:30:00.000Z'); // 22 Aug 2026, noon IST
    const coconut = makePlant({ id: 'coco-1', plant_type: 'coconut_tree', name: 'Coconut A' });
    const mango = makePlant({ id: 'mango-1', plant_type: 'fruit_tree', name: 'Mango' });

    const harvestedOn = (plantId: string, date: Date, id = `h-${plantId}`): JournalEntry =>
      makeJournalEntry({ id, plant_id: plantId, created_at: date.toISOString() });

    it('uses a farmer-entered expected date and labels its source', () => {
      const plant = makePlant({
        id: 'tomato-1',
        plant_type: 'vegetable',
        expected_harvest_date: '2026-08-25T12:30:00.000Z',
      });
      const items = computeHarvestsReady([plant], [], NOW);
      expect(items).toHaveLength(1);
      expect(items[0]?.isReady).toBe(true);
      expect(items[0]?.daysUntil).toBe(3);
      expect(items[0]?.source).toBe('farmer_date');
    });

    it('uses an enabled harvest task ahead of the plant estimate', () => {
      const plant = makePlant({
        id: 'tomato-1',
        expected_harvest_date: '2026-08-29T12:30:00.000Z',
      });
      const task = makeTaskTemplate({
        id: 'harvest-task',
        plant_id: plant.id,
        task_type: 'harvest',
        enabled: true,
        next_due_at: '2026-08-24T12:30:00.000Z',
      });
      const items = computeHarvestsReady([plant], [], NOW, [task]);
      expect(items[0]?.daysUntil).toBe(2);
      expect(items[0]?.source).toBe('scheduled_task');
    });

    it('keeps a supported harvest date that is approaching but not yet ready', () => {
      const plant = makePlant({ expected_harvest_date: '2026-09-05T12:30:00.000Z' });
      const items = computeHarvestsReady([plant], [], NOW);
      expect(items).toHaveLength(1);
      expect(items[0]?.isReady).toBe(false);
      expect(items[0]?.daysUntil).toBeGreaterThan(7);
    });

    it('keeps a missed explicit window visible as an overdue check', () => {
      const plant = makePlant({ expected_harvest_date: '2026-08-10T12:30:00.000Z' });
      const items = computeHarvestsReady([plant], [], NOW);
      expect(items[0]?.daysUntil).toBe(-12);
      expect(items[0]?.isReady).toBe(true);
    });

    it('drops dates beyond the 30-day horizon', () => {
      const plant = makePlant({ expected_harvest_date: '2026-10-10T12:30:00.000Z' });
      expect(computeHarvestsReady([plant], [], NOW)).toEqual([]);
    });

    it('suppresses a one-off farmer date once harvest was logged on or after it', () => {
      const plant = makePlant({
        id: 'tom-1',
        expected_harvest_date: '2026-08-20T12:30:00.000Z',
      });
      expect(
        computeHarvestsReady(
          [plant],
          [harvestedOn(plant.id, new Date('2026-08-21T06:30:00.000Z'))],
          NOW
        )
      ).toEqual([]);
    });

    it('does not invent generic coconut or fruit-tree cycles from harvest history', () => {
      expect(
        computeHarvestsReady(
          [coconut, mango],
          [
            harvestedOn(coconut.id, new Date('2026-06-20T06:30:00.000Z')),
            harvestedOn(mango.id, new Date('2026-02-20T06:30:00.000Z')),
          ],
          NOW
        )
      ).toEqual([]);
    });

    // The lookups below moved out of the per-plant loop into one-pass Maps.
    // These pin the edges that shape did not previously exercise.
    it('picks the earliest of several harvest tasks for one plant', () => {
      const plant = makePlant({ id: 'okra-1', plant_type: 'vegetable' });
      const items = computeHarvestsReady([plant], [], NOW, [
        makeTaskTemplate({
          id: 'late',
          plant_id: plant.id,
          task_type: 'harvest',
          next_due_at: '2026-09-10T12:30:00.000Z',
        }),
        makeTaskTemplate({
          id: 'early',
          plant_id: plant.id,
          task_type: 'harvest_leaves',
          next_due_at: '2026-08-24T12:30:00.000Z',
        }),
      ]);
      expect(items).toHaveLength(1);
      expect(items[0]?.source).toBe('scheduled_task');
      expect(items[0]?.daysUntil).toBe(2);
    });

    it('ignores a harvest task with no due date rather than throwing', () => {
      const plant = makePlant({
        id: 'brinjal-1',
        plant_type: 'vegetable',
        expected_harvest_date: '2026-08-25T12:30:00.000Z',
      });
      const items = computeHarvestsReady([plant], [], NOW, [
        makeTaskTemplate({
          id: 'broken',
          plant_id: plant.id,
          task_type: 'harvest',
          next_due_at: null as unknown as string,
        }),
      ]);
      // Falls back to the farmer's date instead of being suppressed or crashing.
      expect(items).toHaveLength(1);
      expect(items[0]?.source).toBe('farmer_date');
    });

    it('does not let another plant’s harvest suppress this one', () => {
      const plant = makePlant({
        id: 'chilli-1',
        plant_type: 'vegetable',
        expected_harvest_date: '2026-08-25T12:30:00.000Z',
      });
      const items = computeHarvestsReady(
        [plant],
        [harvestedOn('someone-else', new Date('2026-08-26T06:30:00.000Z'))],
        NOW
      );
      expect(items).toHaveLength(1);
    });

    it('does not let an unparseable harvest date suppress a farmer date', () => {
      const plant = makePlant({
        id: 'beans-1',
        plant_type: 'vegetable',
        expected_harvest_date: '2026-08-25T12:30:00.000Z',
      });
      const items = computeHarvestsReady(
        [plant],
        [makeJournalEntry({ id: 'bad', plant_id: plant.id, created_at: 'not-a-date' })],
        NOW
      );
      expect(items).toHaveLength(1);
    });

    it('suppresses using the newest harvest even when entries are out of order', () => {
      const plant = makePlant({
        id: 'gourd-1',
        plant_type: 'vegetable',
        expected_harvest_date: '2026-08-25T12:30:00.000Z',
      });
      const items = computeHarvestsReady(
        [plant],
        [
          harvestedOn(plant.id, new Date('2026-08-26T06:30:00.000Z'), 'newest'),
          harvestedOn(plant.id, new Date('2026-07-01T06:30:00.000Z'), 'oldest'),
        ],
        NOW
      );
      expect(items).toEqual([]);
    });
  });
});

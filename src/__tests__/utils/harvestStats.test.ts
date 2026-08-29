import {
  summarizeHarvests,
  groupHarvestsBySeason,
  groupHarvestsByTree,
  computeHarvestsReady,
  isHarvestJournalEntry,
  isHarvestSatisfied,
  getHarvestBasis,
  CUT_AND_COME_AGAIN_INTERVAL_DAYS,
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
    it('returns zeros for no entries', () => {
      expect(summarizeHarvests([])).toEqual({
        count: 0,
        total: 0,
        average: 0,
        unit: 'pcs',
        excludedCount: 0,
      });
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
      expect(s.excludedCount).toBe(0);
    });

    it('converts weight units into one kg total rather than adding raw numbers', () => {
      const s = summarizeHarvests([
        makeJournalEntry({ id: 'a', harvest_quantity: 2, harvest_unit: 'kg' }),
        makeJournalEntry({ id: 'b', harvest_quantity: 500, harvest_unit: 'g' }),
      ]);
      expect(s.total).toBe(2.5);
      expect(s.unit).toBe('kg');
    });

    // The defect this replaces: 2 kg + 3 bunches was reported as "5 kg",
    // taking its unit from whichever entry happened to come first.
    it('excludes count units from a weight total and says how many it left out', () => {
      const s = summarizeHarvests([
        makeJournalEntry({ id: 'a', harvest_quantity: 2, harvest_unit: 'kg' }),
        makeJournalEntry({ id: 'b', harvest_quantity: 3, harvest_unit: 'bunches' }),
      ]);
      expect(s.count).toBe(2);
      expect(s.total).toBe(2);
      expect(s.average).toBe(2);
      expect(s.unit).toBe('kg');
      expect(s.excludedCount).toBe(1);
    });

    it('totals counts when nothing was weighed', () => {
      const s = summarizeHarvests([
        makeJournalEntry({ id: 'a', harvest_quantity: 12, harvest_unit: 'pcs' }),
        makeJournalEntry({ id: 'b', harvest_quantity: 8, harvest_unit: 'bunches' }),
      ]);
      expect(s.unit).toBe('pcs');
      expect(s.total).toBe(20);
      expect(s.excludedCount).toBe(0);
    });

    it('derives the basis from whether anything was weighed', () => {
      expect(getHarvestBasis([makeJournalEntry({ harvest_unit: 'pcs' })])).toBe('pcs');
      expect(getHarvestBasis([makeJournalEntry({ harvest_unit: 'g' })])).toBe('kg');
      expect(getHarvestBasis([])).toBe('pcs');
    });
  });

  describe('isHarvestSatisfied', () => {
    it('is unsatisfied with nothing harvested', () => {
      expect(isHarvestSatisfied('one_shot', null, null)).toBe(false);
    });

    it('is unsatisfied when the only harvest predates the due date', () => {
      expect(isHarvestSatisfied('one_shot', -1, 30)).toBe(false);
    });

    it('is satisfied by a harvest on or after the due date', () => {
      expect(isHarvestSatisfied('one_shot', 0, 0)).toBe(true);
      expect(isHarvestSatisfied(null, 3, 3)).toBe(true);
    });

    it('re-arms a cut-and-come-again crop after a full picking cycle', () => {
      expect(
        isHarvestSatisfied('cut_and_come_again', 0, CUT_AND_COME_AGAIN_INTERVAL_DAYS - 1)
      ).toBe(true);
      expect(isHarvestSatisfied('cut_and_come_again', 0, CUT_AND_COME_AGAIN_INTERVAL_DAYS)).toBe(
        false
      );
    });

    it('does not re-arm any other mode', () => {
      expect(isHarvestSatisfied('one_shot', 0, 90)).toBe(true);
      expect(isHarvestSatisfied(null, 0, 90)).toBe(true);
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

    it('ignores entries off the chosen basis so nuts and kilograms never mix', () => {
      const trees = groupHarvestsByTree([
        makeJournalEntry({
          id: '1',
          harvest_quantity: 2,
          harvest_unit: 'kg',
          harvest_tree_number: 1,
        }),
        makeJournalEntry({
          id: '2',
          harvest_quantity: 9,
          harvest_unit: 'pcs',
          harvest_tree_number: 1,
        }),
      ]);
      expect(trees).toEqual([{ treeNumber: 1, total: 2, count: 1 }]);
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

    it('returns the most urgent check first, whatever order the plants arrive in', () => {
      const items = computeHarvestsReady(
        [
          makePlant({ id: 'far', name: 'Far', expected_harvest_date: '2026-09-19T12:30:00.000Z' }),
          makePlant({ id: 'late', name: 'Late', expected_harvest_date: '2026-08-19T12:30:00.000Z' }),
          makePlant({ id: 'soon', name: 'Soon', expected_harvest_date: '2026-08-27T12:30:00.000Z' }),
        ],
        [],
        NOW
      );
      expect(items.map((item) => item.daysUntil)).toEqual([-3, 5, 28]);
    });

    it('breaks a same-day tie on plant name so the order cannot reshuffle', () => {
      const sameDay = '2026-08-25T12:30:00.000Z';
      const items = computeHarvestsReady(
        [
          makePlant({ id: 'k', name: 'Keerai', expected_harvest_date: sameDay }),
          makePlant({ id: 'b', name: 'Brinjal', expected_harvest_date: sameDay }),
        ],
        [],
        NOW
      );
      expect(items.map((item) => item.plant.name)).toEqual(['Brinjal', 'Keerai']);
    });

    // The horizon is unchanged by the Harvest Ready / Harvest soon split — a
    // look-ahead crop is still returned, just flagged so the screen can defer it
    // below the work that is actually due rather than pinning it to the top.
    it('returns a crop twelve days out, flagged as not ready', () => {
      const plant = makePlant({ expected_harvest_date: '2026-09-03T12:30:00.000Z' });
      const items = computeHarvestsReady([plant], [], NOW);
      expect(items[0]?.daysUntil).toBe(12);
      expect(items[0]?.isReady).toBe(false);
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

    // Both write paths now feed the same suppression. Before this, a logged
    // harvest cleared only the Care Plan and a completed task cleared only the
    // Today alert, so whichever way the farmer recorded it, one surface kept asking.
    it('suppresses a scheduled harvest task once a harvest was logged on or after its due date', () => {
      const plant = makePlant({ id: 'keerai-1', plant_type: 'spinach' });
      const task = makeTaskTemplate({
        id: 'harvest-task',
        plant_id: plant.id,
        task_type: 'harvest_leaves',
        enabled: true,
        next_due_at: '2026-08-20T12:30:00.000Z',
      });
      expect(
        computeHarvestsReady(
          [plant],
          [harvestedOn(plant.id, new Date('2026-08-21T06:30:00.000Z'))],
          NOW,
          [task]
        )
      ).toEqual([]);
    });

    it('keeps a scheduled task visible once it has advanced past the logged harvest', () => {
      const plant = makePlant({ id: 'keerai-2', plant_type: 'spinach' });
      const task = makeTaskTemplate({
        id: 'harvest-task',
        plant_id: plant.id,
        task_type: 'harvest_leaves',
        enabled: true,
        // Rescheduled by markTaskDone after the harvest below was logged.
        next_due_at: '2026-09-04T12:30:00.000Z',
      });
      const items = computeHarvestsReady(
        [plant],
        [harvestedOn(plant.id, new Date('2026-08-21T06:30:00.000Z'))],
        NOW,
        [task]
      );
      expect(items).toHaveLength(1);
      expect(items[0]?.source).toBe('scheduled_task');
    });

    it('reads last_harvest_date, so a completed harvest task also clears the card', () => {
      const plant = makePlant({
        id: 'brinjal-2',
        plant_type: 'vegetable',
        expected_harvest_date: '2026-08-20T12:30:00.000Z',
        last_harvest_date: '2026-08-21T06:30:00.000Z',
      });
      expect(computeHarvestsReady([plant], [], NOW)).toEqual([]);
    });

    it('re-arms a cut-and-come-again crop a full picking cycle after its last harvest', () => {
      const base = {
        id: 'keerai-3',
        plant_type: 'spinach' as const,
        harvest_mode: 'cut_and_come_again' as const,
        expected_harvest_date: '2026-08-01T12:30:00.000Z',
      };
      // Picked 3 days ago — still satisfied, nothing to prompt.
      expect(
        computeHarvestsReady(
          [makePlant({ ...base, last_harvest_date: '2026-08-19T06:30:00.000Z' })],
          [],
          NOW
        )
      ).toEqual([]);
      // Picked 15 days ago — due for the next picking.
      const items = computeHarvestsReady(
        [makePlant({ ...base, last_harvest_date: '2026-08-07T06:30:00.000Z' })],
        [],
        NOW
      );
      expect(items).toHaveLength(1);
      expect(items[0]?.isReady).toBe(true);
    });

    it('does not re-arm a one_shot crop after its harvest', () => {
      const plant = makePlant({
        id: 'onion-1',
        plant_type: 'vegetable',
        harvest_mode: 'one_shot',
        expected_harvest_date: '2026-08-01T12:30:00.000Z',
        last_harvest_date: '2026-08-02T06:30:00.000Z',
      });
      expect(computeHarvestsReady([plant], [], NOW)).toEqual([]);
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

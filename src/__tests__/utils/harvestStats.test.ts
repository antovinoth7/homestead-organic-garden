import {
  summarizeHarvests,
  groupHarvestsBySeason,
  groupHarvestsByTree,
} from '@/utils/harvestStats';
import { makeJournalEntry } from '../fixtures/journal.fixtures';

describe('harvestStats', () => {
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
});

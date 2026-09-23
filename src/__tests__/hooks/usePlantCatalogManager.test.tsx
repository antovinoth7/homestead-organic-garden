/* The repository's Jest preset is Node-only, so this test stubs the native and
 * service boundaries and drives the hook through a probe component. */
/* eslint-disable import/first */
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));
// Focus-driven reloads would fire on mount and race the assertions; the tests
// call `reload()` themselves so each load is deliberate.
jest.mock('@react-navigation/native', () => ({ useFocusEffect: () => undefined }));

// Two categories, one plant and one hidden plant each, so a filter that fails
// to narrow — or fails to widen — is visible in the counts.
jest.mock('@/services/plantProfiles', () => ({
  DEFAULT_PLANT_PROFILES: {},
  PLANT_CATEGORIES: ['vegetable', 'spinach'],
  getPlantProfiles: jest.fn(),
  getPlantNamesForType: (_profiles: unknown, plantType: string) =>
    plantType === 'vegetable' ? ['Tomato'] : ['Palak'],
  getMergedProfiles: (profiles: unknown) => profiles,
  getHiddenPlantNames: () => ({ vegetable: ['Okra'], spinach: ['Mulai Keerai'] }),
  restorePlantProfile: jest.fn(),
}));
jest.mock('@/services/plants', () => ({
  getAllPlants: jest.fn(),
  getStoredPlants: jest.fn(),
}));
jest.mock('@/utils/plantCareDefaults', () => ({ getPlantCareProfile: () => ({}) }));
jest.mock('@/utils/catalogSummaries', () => ({ buildCatalogMetaLine: () => 'meta' }));
jest.mock('@/utils/plantHelpers', () => ({
  deriveInstanceLifecycle: () => 'annual',
  isPlantArchived: (plant: { archived_at?: string | null }) => !!plant.archived_at,
}));
jest.mock('@/utils/plantLabels', () => ({
  LIFECYCLE_LABELS: { annual: 'Annual' },
  HABIT_LABELS: { annual_bed: 'Annual' },
}));
jest.mock('@/config/plants/catalogTaxonomy', () => ({
  CATALOG_GROUP_ORDER: ['vegetables', 'greens'],
  getTaxonomy: (_name: string, plantType: string) =>
    plantType === 'vegetable'
      ? { group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed' }
      : { group: 'greens', subGroup: 'spinach', habit: 'annual_bed' },
}));
jest.mock('@/utils/errorLogging', () => ({
  getErrorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
  logError: jest.fn(),
}));

import React from 'react';
import { Alert } from 'react-native';
import { usePlantCatalogManager } from '@/hooks/usePlantCatalogManager';
import type { UsePlantCatalogManagerReturn } from '@/hooks/usePlantCatalogManager';
import { getPlantProfiles } from '@/services/plantProfiles';
import { getStoredPlants } from '@/services/plants';
import { logError } from '@/utils/errorLogging';
import { ALL_GROUPS } from '@/utils/catalogListItems';
import { makePlant } from '../fixtures/plant.fixtures';

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => { unmount: () => void };
  act: (callback: () => void | Promise<void>) => Promise<void>;
};

const mockProfiles = getPlantProfiles as jest.Mock;
const mockStored = getStoredPlants as jest.Mock;
const mockLogError = logError as jest.Mock;
const mockAlert = Alert.alert as unknown as jest.Mock;

/** The hook's latest return value, captured from a throwaway host component. */
let latest: UsePlantCatalogManagerReturn;

function Probe(): null {
  const value = usePlantCatalogManager();
  // Captured in an effect rather than assigned during render: reassigning an
  // outer binding mid-render is a side effect (react-hooks/globals). Effects
  // flush inside `act`, so `latest` is still set before any assertion runs.
  React.useEffect(() => {
    latest = value;
  });
  return null;
}

async function mount(): Promise<{ unmount: () => void }> {
  let tree!: { unmount: () => void };
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(<Probe />);
  });
  return tree;
}

/** One garden plant, freshly allocated each call so identities never coincide. */
const garden = (variety: string): unknown[] => [
  makePlant({ id: 'a', plant_type: 'vegetable', plant_variety: variety }),
];

describe('usePlantCatalogManager', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  beforeEach(() => {
    jest.clearAllMocks();
    mockProfiles.mockResolvedValue({ vegetable: {} });
    mockStored.mockImplementation(() => Promise.resolve(garden('Tomato')));
  });

  describe('the all filter', () => {
    it('opens on all, so the catalog is browsable before anything is chosen', async () => {
      const tree = await mount();

      expect(latest.activeGroup).toBe(ALL_GROUPS);
      tree.unmount();
    });

    it('spans every category while all is selected', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });

      expect(latest.groupData.entries.map((entry) => entry.name).sort()).toEqual([
        'Palak',
        'Tomato',
      ]);
      tree.unmount();
    });

    it('narrows to the chosen category', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });
      await TestRenderer.act(async () => {
        latest.setActiveGroup('greens');
      });

      expect(latest.groupData.entries.map((entry) => entry.name)).toEqual(['Palak']);
      tree.unmount();
    });

    it('files each entry under its own group, which the all list sections by', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });

      const byName = Object.fromEntries(
        latest.groupData.entries.map((entry) => [entry.name, entry.group])
      );
      expect(byName).toEqual({ Tomato: 'vegetables', Palak: 'greens' });
      tree.unmount();
    });

    it('counts the whole catalog under all, alongside the per-category counts', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });

      expect(latest.groupCounts[ALL_GROUPS]).toBe(2);
      expect(latest.groupCounts.vegetables).toBe(1);
      expect(latest.groupCounts.greens).toBe(1);
      tree.unmount();
    });

    // Without this, deleting a plant then leaving the filter on All would hide
    // the only control that restores it.
    it('lists every hidden plant under all, not just one category worth', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });

      expect(latest.hiddenPlantNames.map((hidden) => hidden.name).sort()).toEqual([
        'Mulai Keerai',
        'Okra',
      ]);
      tree.unmount();
    });

    it('narrows the hidden plants once a category is chosen', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });
      await TestRenderer.act(async () => {
        latest.setActiveGroup('greens');
      });

      expect(latest.hiddenPlantNames.map((hidden) => hidden.name)).toEqual(['Mulai Keerai']);
      tree.unmount();
    });
  });

  describe('reload identity guard', () => {
    it('keeps the built entries when a revalidate finds the same data', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });
      const first = latest.groupData.entries;

      // A fresh but structurally identical read — what getStoredPlants returns
      // once its cache TTL lapses. Re-adopting it would re-resolve every entry.
      await TestRenderer.act(async () => {
        await latest.reload({ silent: true });
      });

      expect(latest.groupData.entries).toBe(first);
      tree.unmount();
    });

    it('rebuilds when a plant changes the variety counts', async () => {
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload();
      });
      const first = latest.groupData.entries;

      mockStored.mockImplementation(() => Promise.resolve(garden('Brinjal')));
      await TestRenderer.act(async () => {
        await latest.reload({ silent: true });
      });

      expect(latest.groupData.entries).not.toBe(first);
      tree.unmount();
    });
  });

  describe('load failure', () => {
    it('reports the failure instead of leaving the list looking empty', async () => {
      mockProfiles.mockRejectedValue(new Error('offline'));
      const tree = await mount();

      await TestRenderer.act(async () => {
        await latest.reload();
      });

      expect(latest.error).toBe('offline');
      expect(latest.loading).toBe(false);
      expect(mockLogError).toHaveBeenCalled();
      tree.unmount();
    });

    it('never interrupts with an alert — the screen shows a retry banner instead', async () => {
      mockProfiles.mockRejectedValue(new Error('offline'));
      const tree = await mount();

      await TestRenderer.act(async () => {
        await latest.reload();
      });

      expect(latest.error).toBe('offline');
      expect(mockAlert).not.toHaveBeenCalled();
      tree.unmount();
    });

    it('stays quiet on a silent revalidate, which runs on every focus', async () => {
      mockProfiles.mockRejectedValue(new Error('offline'));
      const tree = await mount();

      await TestRenderer.act(async () => {
        await latest.reload({ silent: true });
      });

      expect(latest.error).toBe('offline');
      expect(mockAlert).not.toHaveBeenCalled();
      tree.unmount();
    });

    it('clears the error once a load succeeds', async () => {
      mockProfiles.mockRejectedValue(new Error('offline'));
      const tree = await mount();
      await TestRenderer.act(async () => {
        await latest.reload({ silent: true });
      });
      expect(latest.error).toBe('offline');

      mockProfiles.mockResolvedValue({ vegetable: {} });
      await TestRenderer.act(async () => {
        await latest.reload({ silent: true });
      });

      expect(latest.error).toBeNull();
      tree.unmount();
    });
  });
});

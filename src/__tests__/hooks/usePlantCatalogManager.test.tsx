/* The repository's Jest preset is Node-only, so this test stubs the native and
 * service boundaries and drives the hook through a probe component. */
/* eslint-disable import/first */
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));
// Focus-driven reloads would fire on mount and race the assertions; the tests
// call `reload()` themselves so each load is deliberate.
jest.mock('@react-navigation/native', () => ({ useFocusEffect: () => undefined }));

jest.mock('@/services/plantProfiles', () => ({
  DEFAULT_PLANT_PROFILES: {},
  PLANT_CATEGORIES: ['vegetable'],
  getPlantProfiles: jest.fn(),
  getPlantNamesForType: () => ['Tomato'],
  getMergedProfiles: (profiles: unknown) => profiles,
  getHiddenPlantNames: () => ({ vegetable: [] }),
  restorePlantProfile: jest.fn(),
}));
jest.mock('@/services/plants', () => ({
  getAllPlants: jest.fn(),
  getStoredPlants: jest.fn(),
}));
jest.mock('@/utils/plantCareDefaults', () => ({ getPlantCareProfile: () => ({}) }));
jest.mock('@/utils/catalogSummaries', () => ({ buildCatalogMetaLine: () => 'meta' }));
jest.mock('@/utils/plantHelpers', () => ({ deriveInstanceLifecycle: () => 'annual' }));
jest.mock('@/utils/plantLabels', () => ({ LIFECYCLE_LABELS: { annual: 'Annual' } }));
jest.mock('@/config/plants/catalogTaxonomy', () => ({
  CATALOG_GROUP_ORDER: ['vegetables'],
  getTaxonomy: () => ({ group: 'vegetables', subGroup: 'fruit_vegetables', habit: 'annual_bed' }),
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
  latest = usePlantCatalogManager();
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

    it('alerts on a load the user asked for', async () => {
      mockProfiles.mockRejectedValue(new Error('offline'));
      const tree = await mount();

      await TestRenderer.act(async () => {
        await latest.reload();
      });

      expect(mockAlert).toHaveBeenCalled();
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

/* The repository's Jest preset is Node-only, so this test stubs the native and
 * service boundaries (never Firestore itself) and drives the hook through a
 * probe component, firing focus by hand. */
/* eslint-disable import/first */
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
}));
/** The latest focus callback the hook registered; tests call it to "focus". */
let mockFocus: (() => void) | undefined;
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void) => {
    mockFocus = callback;
  },
}));
jest.mock('@/services/plants', () => ({
  getAllPlants: jest.fn(),
  getCachedPlants: jest.fn(),
}));
jest.mock('@/services/locations', () => ({
  getLocationConfig: jest.fn(),
}));
jest.mock('@/lib/dataCache', () => ({
  CACHE_KEYS: { ALL_PLANTS: 'allPlants' },
  invalidate: jest.fn(),
}));
jest.mock('@/utils/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), debug: jest.fn(), info: jest.fn() },
}));
jest.mock('@/utils/errorLogging', () => ({
  getErrorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error)),
}));

import React from 'react';
import { Alert } from 'react-native';
import { usePlantList } from '@/hooks/usePlantList';
import type { UsePlantListResult } from '@/hooks/usePlantList';
import { getAllPlants, getCachedPlants } from '@/services/plants';
import { getLocationConfig } from '@/services/locations';
import { invalidate } from '@/lib/dataCache';
import { makePlant } from '../fixtures/plant.fixtures';

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => { unmount: () => void };
  act: (callback: () => void | Promise<void>) => Promise<void>;
};

const mockGetAll = getAllPlants as jest.Mock;
const mockCached = getCachedPlants as jest.Mock;
const mockLocations = getLocationConfig as jest.Mock;
const mockInvalidate = invalidate as jest.Mock;
const mockAlert = Alert.alert as unknown as jest.Mock;

let latest: UsePlantListResult;
let renders = 0;

function Probe(): null {
  const value = usePlantList();
  // Captured in an effect rather than during render (react-hooks/globals).
  React.useEffect(() => {
    latest = value;
    renders += 1;
  });
  return null;
}

async function mountAndFocus(): Promise<{ unmount: () => void }> {
  let tree!: { unmount: () => void };
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(<Probe />);
  });
  await focus();
  return tree;
}

async function focus(): Promise<void> {
  await TestRenderer.act(async () => {
    mockFocus?.();
  });
}

const GARDEN = [makePlant({ id: 'a', name: 'Tomato' }), makePlant({ id: 'b', name: 'Okra' })];

describe('usePlantList', () => {
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
    mockFocus = undefined;
    renders = 0;
    mockGetAll.mockResolvedValue(GARDEN);
    mockCached.mockReturnValue(null);
    mockLocations.mockResolvedValue({ parentLocations: ['Home'], childLocations: ['Back'] });
  });

  it('loads plants and locations on first focus, then clears loading', async () => {
    const tree = await mountAndFocus();

    expect(latest.loading).toBe(false);
    expect(latest.plants).toBe(GARDEN);
    expect(latest.parentLocations).toEqual(['Home']);
    expect(latest.childLocations).toEqual(['Back']);
    tree.unmount();
  });

  it('does not re-render on a refocus that finds the same data', async () => {
    const tree = await mountAndFocus();
    const before = renders;
    // Same plant array (what getAllPlants returns for unchanged data) and
    // equal-but-new location arrays (what a lapsed location cache returns).
    mockLocations.mockResolvedValue({ parentLocations: ['Home'], childLocations: ['Back'] });

    await focus();

    expect(renders).toBe(before);
    expect(latest.loading).toBe(false);
    tree.unmount();
  });

  it('paints the warm cache at once on focus, before the revalidate lands', async () => {
    const tree = await mountAndFocus();
    const surgical = [GARDEN[0]!];
    mockCached.mockReturnValue(surgical);
    mockGetAll.mockReturnValue(new Promise(() => undefined));

    await focus();

    expect(latest.plants).toBe(surgical);
    tree.unmount();
  });

  it('keeps a refocus silent: no alert when the background refresh fails', async () => {
    const tree = await mountAndFocus();
    mockGetAll.mockRejectedValue(new Error('offline'));

    await focus();

    expect(mockAlert).not.toHaveBeenCalled();
    expect(latest.plants).toBe(GARDEN);
    tree.unmount();
  });

  it('alerts when the first load fails', async () => {
    mockGetAll.mockRejectedValue(new Error('Not authenticated'));

    const tree = await mountAndFocus();

    expect(mockAlert).toHaveBeenCalledWith('Error', 'Not authenticated');
    expect(latest.loading).toBe(false);
    tree.unmount();
  });

  it('reaches past the 30 s cache on pull-to-refresh', async () => {
    const tree = await mountAndFocus();
    const fresh = [makePlant({ id: 'c', name: 'Chilli' })];
    mockGetAll.mockResolvedValue(fresh);

    await TestRenderer.act(async () => {
      await latest.refresh();
    });

    expect(mockInvalidate).toHaveBeenCalledWith('allPlants');
    expect(mockInvalidate.mock.invocationCallOrder[0]!).toBeLessThan(
      mockGetAll.mock.invocationCallOrder[mockGetAll.mock.invocationCallOrder.length - 1]!
    );
    expect(latest.plants).toBe(fresh);
    expect(latest.refreshing).toBe(false);
    tree.unmount();
  });
});

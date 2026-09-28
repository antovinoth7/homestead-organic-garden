/**
 * Deleting a catalog entry must not claim success it did not get.
 *
 * The screen navigates back on a resolved delete, so when the service swallowed
 * a remote failure the user was returned to a list that still held the plant —
 * and the next sync put it back. The service rethrows now; this pins the hook's
 * half of that contract. Module boundaries are stubbed, never the Firestore SDK.
 */
/* eslint-disable import/first */
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, addListener: () => () => undefined }),
}));
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
}));
jest.mock('@/services/plantProfiles', () => ({
  DEFAULT_PLANT_PROFILES: { vegetable: { Tomato: { plantType: 'vegetable', name: 'Tomato' } } },
  deletePlantProfile: jest.fn(),
  renamePlantProfile: jest.fn(),
  savePlantProfile: jest.fn(),
  savePlantProfiles: jest.fn(),
  getPlantProfiles: jest.fn(async () => ({ vegetable: {} })),
  getPlantNamesForType: jest.fn(() => ['Tomato']),
  getProfileEntry: jest.fn(() => ({ plantType: 'vegetable', name: 'Tomato' })),
  isBundledPlant: jest.fn(
    (type: string, name: string) => type === 'vegetable' && name === 'Tomato'
  ),
}));
jest.mock('@/services/plants', () => ({
  getAllPlants: jest.fn(async () => []),
  getStoredPlants: jest.fn(async () => []),
  updatePlantVariety: jest.fn(async () => undefined),
}));
jest.mock('@/utils/errorLogging', () => ({
  getErrorMessage: (e: unknown) => (e instanceof Error ? e.message : String(e)),
  logError: jest.fn(),
}));

import React from 'react';
import { Alert } from 'react-native';
import { useCatalogEntryForm } from '@/hooks/useCatalogEntryForm';
import type { UseCatalogEntryFormReturn } from '@/hooks/useCatalogEntryForm';
import { deletePlantProfile } from '@/services/plantProfiles';

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => { unmount: () => void };
  act: (callback: () => void | Promise<void>) => Promise<void>;
};

const mockDelete = deletePlantProfile as jest.Mock;
const mockAlert = Alert.alert as unknown as jest.Mock;

let latest: UseCatalogEntryFormReturn;

function Probe({ name }: { name: string }): null {
  const value = useCatalogEntryForm({
    initialName: name,
    plantType: 'vegetable',
    isCreating: false,
    anyModalOpen: false,
  });
  // Captured in an effect rather than assigned during render: reassigning an
  // outer binding mid-render is a side effect (react-hooks/globals). Effects
  // flush inside `act`, so `latest` is still set before any assertion runs.
  React.useEffect(() => {
    latest = value;
  });
  return null;
}

async function mount(name = 'Tomato'): Promise<{ unmount: () => void }> {
  let tree!: { unmount: () => void };
  await TestRenderer.act(async () => {
    tree = TestRenderer.create(<Probe name={name} />);
  });
  return tree;
}

describe('useCatalogEntryForm — delete', () => {
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
    mockDelete.mockResolvedValue({ vegetable: {} });
  });

  it('does not report success when the delete could not be saved', async () => {
    mockDelete.mockRejectedValue(new Error('Missing or insufficient permissions.'));
    const tree = await mount();

    await TestRenderer.act(async () => {
      await latest.confirmDelete();
    });

    // Navigating back here is what told the user it had worked.
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(mockAlert).toHaveBeenCalled();
    tree.unmount();
  });

  it('reports success when the delete resolves', async () => {
    const tree = await mount();

    await TestRenderer.act(async () => {
      await latest.confirmDelete();
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockAlert).not.toHaveBeenCalled();
    tree.unmount();
  });

  it('treats an offline delete as a success, since the queue will replay it', async () => {
    // writeOrQueue resolves when it queues, so the service resolves too — the
    // hook must not invent a distinction the service did not make.
    mockDelete.mockResolvedValue({ vegetable: {} });
    const tree = await mount();

    await TestRenderer.act(async () => {
      await latest.confirmDelete();
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    tree.unmount();
  });

  it('knows a bundled entry is hidden, not removed', async () => {
    const tree = await mount('Tomato');
    expect(latest.deleteKind).toBe('hide');
    tree.unmount();
  });

  it('knows a user-added entry is removed for good', async () => {
    const tree = await mount('Backyard Gourd');
    expect(latest.deleteKind).toBe('remove');
    tree.unmount();
  });
});

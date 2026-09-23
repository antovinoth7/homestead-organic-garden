/**
 * Saving a catalog entry must write only what changed, and a bundled plant's
 * name must stay fixed. A clean Save used to store the whole care profile as an
 * override; a rename cut a bundled plant off from its pests, photo and care
 * data. Module boundaries are stubbed, never the Firestore SDK.
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
import { useCatalogEntryForm } from '@/hooks/useCatalogEntryForm';
import type { UseCatalogEntryFormReturn } from '@/hooks/useCatalogEntryForm';
import { deletePlantProfile, savePlantProfile } from '@/services/plantProfiles';

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => { unmount: () => void };
  act: (callback: () => void | Promise<void>) => Promise<void>;
};

const mockDelete = deletePlantProfile as jest.Mock;
const mockSave = savePlantProfile as jest.Mock;

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

describe('useCatalogEntryForm — save', () => {
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

  it('leaves without writing when nothing changed', async () => {
    const tree = await mount();

    await TestRenderer.act(async () => {
      latest.attemptSave();
    });

    expect(mockSave).not.toHaveBeenCalled();
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    tree.unmount();
  });

  it('writes once the form has actually changed', async () => {
    const tree = await mount();

    await TestRenderer.act(async () => {
      latest.setForm({ spacingCm: '75' });
    });
    await TestRenderer.act(async () => {
      latest.attemptSave();
      await Promise.resolve();
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    tree.unmount();
  });

  it('locks the name of a bundled plant but not of one the user added', async () => {
    const bundled = await mount('Tomato');
    expect(latest.nameLocked).toBe(true);
    expect(latest.canReset).toBe(false);
    bundled.unmount();

    const added = await mount('Grandma’s Chilli');
    expect(latest.nameLocked).toBe(false);
    added.unmount();
  });
});

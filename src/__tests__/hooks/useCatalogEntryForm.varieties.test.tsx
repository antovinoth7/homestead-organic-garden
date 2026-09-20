/**
 * Two ways the catalog editor used to lose work.
 *
 * The form read its varieties straight out of the stored override map, which
 * holds only the user's own edits — so every bundled plant opened with an empty
 * variety list, and the next save wrote that emptiness back over the bundled
 * one. `getProfileEntry` is the merged reader and the only correct source.
 *
 * Separately, the care-model picker fed a plant type that the load effect
 * depended on, so choosing a model rebuilt the form and discarded whatever had
 * been typed. Module boundaries are stubbed, never the Firestore SDK.
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

const BUNDLED_TOMATO = {
  plantType: 'vegetable',
  name: 'Tomato',
  varieties: ['Country Tomato', 'Hybrid Tomato', 'Cherry Tomato'],
};

/** The real merge semantics: a stored entry replaces the bundled one whole. */
jest.mock('@/services/plantProfiles', () => ({
  DEFAULT_PLANT_PROFILES: { vegetable: { Tomato: BUNDLED_TOMATO } },
  deletePlantProfile: jest.fn(),
  renamePlantProfile: jest.fn(),
  savePlantProfile: jest.fn(async () => ({ vegetable: {} })),
  savePlantProfiles: jest.fn(),
  getPlantProfiles: jest.fn(async () => ({ vegetable: {} })),
  // A sibling the reassignment flow can move garden plants onto.
  getPlantNamesForType: jest.fn(() => ['Brinjal', 'Tomato']),
  getProfileEntry: jest.fn(
    (profiles: Record<string, Record<string, unknown>>, type: string, name: string) =>
      profiles[type]?.[name] ??
      (type === 'vegetable' && name === 'Tomato' ? BUNDLED_TOMATO : undefined)
  ),
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
import { savePlantProfile } from '@/services/plantProfiles';
import { getStoredPlants } from '@/services/plants';
import type { PlantType } from '@/types/database.types';

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => {
    unmount: () => void;
    update: (element: React.ReactElement) => void;
  };
  act: (callback: () => void | Promise<void>) => Promise<void>;
};

const mockSave = savePlantProfile as jest.Mock;
const mockStoredPlants = getStoredPlants as jest.Mock;

let latest: UseCatalogEntryFormReturn;

interface ProbeProps {
  name: string;
  plantType: PlantType;
  isCreating: boolean;
}

function Probe({ name, plantType, isCreating }: ProbeProps): null {
  latest = useCatalogEntryForm({
    initialName: name,
    plantType,
    isCreating,
    anyModalOpen: false,
  });
  return null;
}

describe('useCatalogEntryForm — bundled varieties and the care model', () => {
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
    mockStoredPlants.mockResolvedValue([]);
  });

  it('opens a bundled plant with the varieties it ships', async () => {
    let tree!: { unmount: () => void };
    await TestRenderer.act(async () => {
      tree = TestRenderer.create(
        <Probe name="Tomato" plantType="vegetable" isCreating={false} />
      );
    });

    expect(latest.varieties).toEqual([
      'Country Tomato',
      'Hybrid Tomato',
      'Cherry Tomato',
    ]);
    tree.unmount();
  });

  it('keeps the bundled varieties when an unrelated field is saved', async () => {
    let tree!: { unmount: () => void };
    await TestRenderer.act(async () => {
      tree = TestRenderer.create(
        <Probe name="Tomato" plantType="vegetable" isCreating={false} />
      );
    });

    // An edit that has nothing to do with varieties is what used to erase them.
    await TestRenderer.act(async () => {
      latest.setForm({ spacingCm: '45' });
    });
    await TestRenderer.act(async () => {
      latest.attemptSave();
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    const [, , saved] = mockSave.mock.calls[0] as [string, string, { varieties?: string[] }];
    expect(saved.varieties).toEqual([
      'Country Tomato',
      'Hybrid Tomato',
      'Cherry Tomato',
    ]);
    tree.unmount();
  });

  it('lets the bundled varieties be removed for real', async () => {
    let tree!: { unmount: () => void };
    await TestRenderer.act(async () => {
      tree = TestRenderer.create(
        <Probe name="Tomato" plantType="vegetable" isCreating={false} />
      );
    });

    await TestRenderer.act(async () => {
      latest.setVarieties([]);
    });
    await TestRenderer.act(async () => {
      latest.attemptSave();
    });

    // `undefined` is how removal is expressed: the stored entry replaces the
    // bundled one whole, so an absent key means "none", not "fall back".
    const [, , saved] = mockSave.mock.calls[0] as [string, string, { varieties?: string[] }];
    expect(saved.varieties).toBeUndefined();
    tree.unmount();
  });

  it('routes a delete through reassignment even if the plants land late', async () => {
    // The garden plants no longer block the form, so the delete decision has to
    // wait for them: counting zero here used to skip reassignment and orphan
    // every plant grown from the entry.
    let release!: (plants: unknown[]) => void;
    mockStoredPlants.mockReturnValue(
      new Promise((resolve) => {
        release = resolve as (plants: unknown[]) => void;
      })
    );

    let tree!: { unmount: () => void };
    await TestRenderer.act(async () => {
      tree = TestRenderer.create(
        <Probe name="Tomato" plantType="vegetable" isCreating={false} />
      );
    });

    let mode: 'confirm' | 'reassign' | null = null;
    await TestRenderer.act(async () => {
      const pending = latest.requestDelete();
      release([{ id: 'p1', plant_type: 'vegetable', plant_variety: 'Tomato' }]);
      mode = await pending;
    });

    expect(mode).toBe('reassign');
    tree.unmount();
  });

  it('keeps what was typed when the care model changes mid-creation', async () => {
    let tree!: {
      unmount: () => void;
      update: (element: React.ReactElement) => void;
    };
    await TestRenderer.act(async () => {
      tree = TestRenderer.create(<Probe name="" plantType="vegetable" isCreating />);
    });

    await TestRenderer.act(async () => {
      latest.setName('Pineapple');
      latest.setForm({ spacingCm: '60', scientificName: 'Ananas comosus' });
    });

    // Picking a different care model is a prop change on the same screen.
    await TestRenderer.act(async () => {
      tree.update(<Probe name="" plantType="fruit_tree" isCreating />);
    });

    expect(latest.name).toBe('Pineapple');
    expect(latest.careForm?.spacingCm).toBe('60');
    expect(latest.careForm?.scientificName).toBe('Ananas comosus');
    tree.unmount();
  });
});

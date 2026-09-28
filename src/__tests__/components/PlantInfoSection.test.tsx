/* The repository's Jest preset is Node-only, so the rows are stubbed as host
 * elements and the section is inspected through the props it hands them. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    View: ({ children }: { children?: React.ReactNode }) =>
      React.createElement('View', null, children),
  };
});
jest.mock('@/components/catalog/CatalogDetailRow', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    CatalogDetailRow: (props: Record<string, unknown>) =>
      React.createElement('CatalogDetailRow', props),
  };
});
jest.mock('@/components/catalog/CatalogTextBlock', () => ({ CatalogTextBlock: () => null }));

import React from 'react';
import { PlantInfoSection } from '@/components/catalog/sections/PlantInfoSection';
import type { CatalogEditor, PickerSheetConfig } from '@/components/catalog/catalogEditor';
import type { CareFormState } from '@/utils/catalogDraft';
import type { CatalogGroup, PlantType } from '@/types/database.types';

interface RowNode {
  props: { label: string; value: string; onPress?: () => void };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => {
    root: { findAll: (predicate: (node: { type: unknown }) => boolean) => RowNode[] };
  };
  act: (callback: () => void) => void;
};

const openPicker = jest.fn<void, [PickerSheetConfig]>();
function openedPicker(): PickerSheetConfig {
  const config = openPicker.mock.calls[0]?.[0];
  if (!config) throw new Error('no picker was opened');
  return config;
}

const onGroupChange = jest.fn<void, [CatalogGroup]>();
const onPlantTypeChange = jest.fn<void, [PlantType]>();

const editor: CatalogEditor = {
  careForm: {
    tamilName: '',
    scientificName: '',
    taxonomicFamily: '',
    lifecycle: '',
    description: '',
  } as unknown as CareFormState,
  setForm: jest.fn(),
  errors: {},
  showErrors: false,
  openText: jest.fn(),
  openPicker,
  openRange: jest.fn(),
};

function render(props: { isCreating: boolean; group?: CatalogGroup; plantType?: PlantType }) {
  let tree!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    tree = TestRenderer.create(
      <PlantInfoSection
        editor={editor}
        name=""
        setName={jest.fn()}
        nameLocked={false}
        onGroupChange={onGroupChange}
        onPlantTypeChange={onPlantTypeChange}
        {...props}
      />
    );
  });
  const rows = tree.root.findAll((node) => node.type === 'CatalogDetailRow');
  return (label: string): RowNode | undefined => rows.find((row) => row.props.label === label);
}

describe('PlantInfoSection — a new catalog entry', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  beforeEach(() => jest.clearAllMocks());

  it('offers the catalog groups, not the old care models', () => {
    const row = render({ isCreating: true, group: 'spices', plantType: 'herb' });
    expect(row('Care model')).toBeUndefined();
    expect(row('Category')?.props.value).toBe('Spices');

    TestRenderer.act(() => row('Category')?.props.onPress?.());
    const config = openedPicker();
    expect(config.options.map((option) => option.label)).toEqual([
      'Vegetables',
      'Greens',
      'Fruits',
      'Spices',
      'Herbs & Medicinal',
      'Flowers',
      'Support & Input Plants',
      'Plantation & Timber',
    ]);
    expect(config.selectedValue).toBe('spices');

    config.onSelect('fruits');
    expect(onGroupChange).toHaveBeenCalledWith('fruits');
  });

  it('asks whether a fruit grows as a tree, and only for Fruits', () => {
    expect(render({ isCreating: true, group: 'vegetables', plantType: 'vegetable' })('Grows as'))
      .toBeUndefined();

    const row = render({ isCreating: true, group: 'fruits', plantType: 'fruit_tree' });
    expect(row('Grows as')?.props.value).toBe('Tree');

    TestRenderer.act(() => row('Grows as')?.props.onPress?.());
    openedPicker().onSelect('vegetable');
    expect(onPlantTypeChange).toHaveBeenCalledWith('vegetable');
  });

  it('shows neither row once the entry exists', () => {
    const row = render({ isCreating: false, group: 'fruits', plantType: 'fruit_tree' });
    expect(row('Category')).toBeUndefined();
    expect(row('Grows as')).toBeUndefined();
  });
});

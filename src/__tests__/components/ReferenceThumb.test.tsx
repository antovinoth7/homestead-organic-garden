/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    View: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('View', props, children),
  };
});
jest.mock('expo-image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    Image: (props: Record<string, unknown>) => React.createElement('Image', props),
  };
});
jest.mock('@/components/GardenIcon', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    GardenIcon: (props: Record<string, unknown>) => React.createElement('GardenIcon', props),
  };
});
jest.mock('@/theme', () => ({ useTheme: () => ({ primary: 'green' }) }));
jest.mock('@/styles/referenceThumbStyles', () => ({
  createStyles: () => ({
    rowImage: 'rowImage',
    rowFallback: 'rowFallback',
    chipImage: 'chipImage',
    chipFallback: 'chipFallback',
    heroImage: 'heroImage',
    heroFallback: 'heroFallback',
    tileImage: 'tileImage',
    tileFallback: 'tileFallback',
  }),
}));

import React from 'react';
import { ReferenceThumb } from '@/components/ReferenceThumb';

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => {
    root: { findAllByType: (type: string) => { props: Record<string, unknown> }[] };
  };
  act: (callback: () => void) => void;
};

describe('ReferenceThumb', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => consoleErrorSpy.mockRestore());

  it('renders the requested semantic fallback when no image exists', () => {
    let rendered!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(
        <ReferenceThumb variant="row" fallbackIcon="general.disease" />
      );
    });

    expect(rendered.root.findAllByType('Image')).toHaveLength(0);
    expect(rendered.root.findAllByType('GardenIcon')[0]?.props.name).toBe('general.disease');
  });

  it('renders a bundled image instead of the fallback', () => {
    let rendered!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(<ReferenceThumb variant="chip" source={{ uri: 'plant' }} />);
    });

    expect(rendered.root.findAllByType('Image')).toHaveLength(1);
    expect(rendered.root.findAllByType('GardenIcon')).toHaveLength(0);
  });

  it('sizes the grid-tile variant as a full-width header image', () => {
    let rendered!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(<ReferenceThumb variant="tile" source={{ uri: 'plant' }} />);
    });

    expect(rendered.root.findAllByType('Image')[0]?.props.style).toBe('tileImage');
  });

  it('falls back to the semantic icon on a grid tile with no photo', () => {
    let rendered!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      rendered = TestRenderer.create(<ReferenceThumb variant="tile" />);
    });

    expect(rendered.root.findAllByType('Image')).toHaveLength(0);
    expect(rendered.root.findAllByType('GardenIcon')[0]?.props.name).toBe('general.plant');
  });
});

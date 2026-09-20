/* The Jest environment is Node-only, so provide the small native boundary used
 * by the voice control and inspect its rendered accessibility contract. */
/* eslint-disable import/first */
jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const host = (name: string) =>
    function Host({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(name, props, children);
    };

  return {
    Alert: { alert: jest.fn() },
    StyleSheet: { create: (value: unknown) => value },
    Text: host('Text'),
    TouchableOpacity: host('TouchableOpacity'),
    View: host('View'),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    Ionicons: (props: Record<string, unknown>) => React.createElement('Ionicons', props),
  };
});

jest.mock('@/theme', () => ({
  useTheme: () => ({
    backgroundSecondary: '#fff',
    backgroundTertiary: '#f4eee6',
    border: '#dccfc0',
    error: '#f44336',
    primary: '#1a4a2e',
    primaryLight: '#edf7f2',
    textInverse: '#fff',
    textSecondary: '#4a3828',
    textTertiary: '#645242',
  }),
}));

jest.mock('@/hooks/useVoiceInput', () => ({ useVoiceInput: jest.fn() }));

import React from 'react';
import { Alert } from 'react-native';
import VoiceDictation from '@/components/VoiceDictation';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import type { UseVoiceInputResult } from '@/hooks/useVoiceInput';

interface RenderedNode {
  props: Record<string, unknown>;
}

interface RenderedTree {
  toJSON: () => unknown;
  root: { findByProps: (props: Record<string, unknown>) => RenderedNode };
}

const TestRenderer = jest.requireActual('react-test-renderer') as {
  create: (element: React.ReactElement) => RenderedTree;
  act: (callback: () => void) => void;
};

const mockUseVoiceInput = useVoiceInput as jest.MockedFunction<typeof useVoiceInput>;
const start = jest.fn(async () => undefined);
const stop = jest.fn();

const voiceState = (overrides: Partial<UseVoiceInputResult> = {}): UseVoiceInputResult => ({
  isListening: false,
  transcript: '',
  partialTranscript: '',
  error: null,
  isAvailable: true,
  unavailableReason: 'none',
  start,
  stop,
  ...overrides,
});

const renderControl = (disabled = false): RenderedTree => {
  let rendered!: RenderedTree;
  TestRenderer.act(() => {
    rendered = TestRenderer.create(
      <VoiceDictation value="" onChangeText={jest.fn()} disabled={disabled} />
    );
  });
  return rendered;
};

describe('VoiceDictation', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    (
      globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseVoiceInput.mockReturnValue(voiceState());
  });

  it('starts with Tamil selected and switches only this control to English', () => {
    const rendered = renderControl();

    expect(
      rendered.root.findByProps({ accessibilityLabel: 'தமிழ் voice language' }).props
        .accessibilityState
    ).toEqual({ disabled: false, selected: true });
    expect(
      rendered.root.findByProps({ accessibilityLabel: 'English voice language' }).props
        .accessibilityState
    ).toEqual({ disabled: false, selected: false });
    expect(mockUseVoiceInput).toHaveBeenLastCalledWith(
      expect.objectContaining({ locale: 'ta-IN' })
    );

    TestRenderer.act(() => {
      const english = rendered.root.findByProps({ accessibilityLabel: 'English voice language' });
      (english.props.onPress as () => void)();
    });

    expect(
      rendered.root.findByProps({ accessibilityLabel: 'தமிழ் voice language' }).props
        .accessibilityState
    ).toEqual({ disabled: false, selected: false });
    expect(
      rendered.root.findByProps({ accessibilityLabel: 'English voice language' }).props
        .accessibilityState
    ).toEqual({ disabled: false, selected: true });
    expect(mockUseVoiceInput).toHaveBeenLastCalledWith(
      expect.objectContaining({ locale: 'en-IN' })
    );
  });

  it('locks the language segments and exposes the stop state while listening', () => {
    mockUseVoiceInput.mockReturnValue(
      voiceState({ isListening: true, partialTranscript: 'வளர்ச்சி நன்றாக உள்ளது' })
    );
    const rendered = renderControl();

    expect(
      rendered.root.findByProps({ accessibilityLabel: 'தமிழ் voice language' }).props.disabled
    ).toBe(true);
    expect(
      rendered.root.findByProps({ accessibilityLabel: 'English voice language' }).props.disabled
    ).toBe(true);
    expect(rendered.root.findByProps({ accessibilityLabel: 'Stop voice input' })).toBeTruthy();
    expect(rendered.root.findByProps({ name: 'stop' })).toBeTruthy();
    expect(JSON.stringify(rendered.toJSON())).toContain('வளர்ச்சி நன்றாக உள்ளது');

    TestRenderer.act(() => {
      const mic = rendered.root.findByProps({ accessibilityLabel: 'Stop voice input' });
      (mic.props.onPress as () => void)();
    });
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('starts recognition normally and disables the mic when the field is disabled', () => {
    const enabled = renderControl();
    TestRenderer.act(() => {
      const mic = enabled.root.findByProps({ accessibilityLabel: 'Start voice input' });
      (mic.props.onPress as () => void)();
    });
    expect(start).toHaveBeenCalledTimes(1);

    const disabled = renderControl(true);
    const mic = disabled.root.findByProps({ accessibilityLabel: 'Start voice input' });
    expect(mic.props.disabled).toBe(true);
    expect(mic.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });

  it('keeps an unavailable recognizer explainable while disabling language selection', () => {
    mockUseVoiceInput.mockReturnValue(
      voiceState({ isAvailable: false, unavailableReason: 'no-recognizer' })
    );
    const rendered = renderControl();

    expect(
      rendered.root.findByProps({ accessibilityLabel: 'தமிழ் voice language' }).props.disabled
    ).toBe(true);
    const mic = rendered.root.findByProps({
      accessibilityLabel: 'Voice input unavailable on this device',
    });
    expect(mic.props.disabled).toBe(false);

    TestRenderer.act(() => {
      (mic.props.onPress as () => void)();
    });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Voice Input',
      expect.stringContaining('no speech recognition service')
    );
  });

  it('renders nothing when the speech module is absent', () => {
    mockUseVoiceInput.mockReturnValue(
      voiceState({ isAvailable: false, unavailableReason: 'no-module' })
    );
    expect(renderControl().toJSON()).toBeNull();
  });
});

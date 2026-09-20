import {
  appendVoiceTranscript,
  voiceErrorMessage,
  VOICE_FALLBACK_ERROR,
} from '@/utils/voiceInput';

describe('voiceErrorMessage', () => {
  it('maps known recognizer codes to user-safe messages', () => {
    expect(voiceErrorMessage('not-allowed')).toMatch(/permission/i);
    expect(voiceErrorMessage('network')).toMatch(/network connection/i);
    expect(voiceErrorMessage('no-speech')).toMatch(/no speech/i);
    expect(voiceErrorMessage('language-not-supported')).toMatch(/not supported/i);
  });

  it('falls back for unknown codes', () => {
    expect(voiceErrorMessage('something-weird')).toBe(VOICE_FALLBACK_ERROR);
    expect(voiceErrorMessage('')).toBe(VOICE_FALLBACK_ERROR);
  });
});

describe('appendVoiceTranscript', () => {
  it('uses the dictated text when content is empty', () => {
    expect(appendVoiceTranscript('', 'tomatoes look healthy')).toBe('tomatoes look healthy');
  });

  it('appends with a separating space to existing content', () => {
    expect(appendVoiceTranscript('watered the beds', 'pruned the basil')).toBe(
      'watered the beds pruned the basil'
    );
  });

  it('returns the previous content unchanged when text is empty', () => {
    expect(appendVoiceTranscript('existing notes', '')).toBe('existing notes');
  });

  it('preserves existing punctuation/newlines, sanitizing only the dictated text', () => {
    expect(appendVoiceTranscript('Floods in monsoon.\nShade after 2pm.', 'drains well')).toBe(
      'Floods in monsoon.\nShade after 2pm. drains well'
    );
  });

  it('preserves Tamil script through the sanitizer', () => {
    expect(appendVoiceTranscript('', 'தக்காளி நன்றாக உள்ளது')).toBe('தக்காளி நன்றாக உள்ளது');
  });

  it('strips punctuation and collapses whitespace in the dictated text', () => {
    expect(appendVoiceTranscript('', 'Hello,   world!')).toBe('Hello world');
  });
});

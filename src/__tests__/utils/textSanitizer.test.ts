import { sanitizeAlphaNumericSpaces, sanitizeFreeText } from '@/utils/textSanitizer';

describe('sanitizeFreeText', () => {
  it('keeps punctuation, units and measurements in notes', () => {
    const note = "Today's fruit: 2.5 kg, pH 6.5 — neem oil 5ml/L (sprayed 6:30)!";
    expect(sanitizeFreeText(note)).toBe(note);
  });

  it('keeps line breaks, tabs and repeated spaces while typing', () => {
    const note = 'Line one\nLine two\r\n\tindented  and spaced ';
    expect(sanitizeFreeText(note)).toBe(note);
  });

  it('keeps Tamil text and emoji', () => {
    expect(sanitizeFreeText('தக்காளி நல்ல விளைச்சல் 🍅')).toBe('தக்காளி நல்ல விளைச்சல் 🍅');
  });

  it('strips invisible control characters', () => {
    expect(sanitizeFreeText('a\u0000b\u0007c\u001Bd\u007Fe')).toBe('abcde');
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeFreeText('')).toBe('');
  });
});

describe('sanitizeAlphaNumericSpaces', () => {
  it('still strips punctuation for name fields', () => {
    expect(sanitizeAlphaNumericSpaces("Today's fruit")).toBe('Today s fruit');
  });
});

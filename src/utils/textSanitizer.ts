// `\p{M}` (combining marks) is kept so Indic scripts such as Tamil survive —
// vowel signs and the virama (e.g. ் in "தக்காளி") are marks, not letters.
export const sanitizeAlphaNumericSpaces = (value: string): string => {
  if (!value) return '';
  const sanitized = value.replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ');
  return sanitized.replace(/\s+/g, ' ');
};

export const sanitizeLandmarkText = (value: string): string => {
  if (!value) return '';
  const sanitized = value.replace(/[^\p{L}\p{N}\p{M},.\-()/]+/gu, ' ');
  return sanitized.replace(/\s+/g, ' ');
};

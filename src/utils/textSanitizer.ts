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

// Invisible C0 control characters and DEL. Tab, LF and CR are left out of the
// class so pasted and multi-line notes survive.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/**
 * For free-text notes (journal content, harvest notes, treatments). Keeps
 * punctuation, digits, line breaks, Tamil and emoji — "Neem oil 5ml/L, pH 6.5"
 * must survive — and strips only invisible control characters. Whitespace is
 * not collapsed: this runs on every keystroke, and collapsing would fight the
 * cursor; the save path trims.
 */
export const sanitizeFreeText = (value: string): string => {
  if (!value) return '';
  return value.replace(CONTROL_CHARS, '');
};

/** Longest amount a card can carry on its second line. */
export const TASK_AMOUNT_MAX_LENGTH = 40;

/**
 * For a task's planned amount — "2 kg compost", "Neem oil 5 ml/L", "1.5 L",
 * "10–15 cm". One line, so line breaks become spaces; the units and ranges a
 * dose is written in survive (`. , / % - – × ( )`), anything else is dropped.
 * Spaces are collapsed but not trimmed, so typing "2 kg " keeps its cursor.
 */
export const sanitizeAmountText = (value: string): string => {
  if (!value) return '';
  const sanitized = value.replace(/[^\p{L}\p{N}\p{M}\s.,/%\-–×()]+/gu, '').replace(/\s+/g, ' ');
  return sanitized.slice(0, TASK_AMOUNT_MAX_LENGTH);
};

/**
 * The one ordering rule for plant names.
 *
 * The catalog used to render in the array-literal order of
 * `DEFAULT_PLANT_CATALOG` — a hand-curated top 25 followed by whatever batch was
 * appended when a feature landed — which reads as random past the first
 * screenful. Every surface that lists plant names now sorts through here so the
 * catalog, the add-plant dropdown and the picker sheet cannot drift apart.
 */

/**
 * Case- and accent-insensitive so `ash gourd` cannot land in a different letter
 * group from `Ash Gourd`, and numeric so a user's `Tomato 10` follows
 * `Tomato 2` rather than preceding it.
 *
 * This is the app's first deliberate use of `localeCompare` options. Hermes
 * without full `Intl` ignores them and falls back to a code-unit comparison,
 * which is acceptable here: catalog names are ASCII, and Tamil names live in a
 * separate field that is never used for ordering.
 */
export function comparePlantNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

/** A–Z copy of `names`, leaving the caller's array untouched. */
export function sortPlantNames(names: readonly string[]): string[] {
  return [...names].sort(comparePlantNames);
}

/**
 * The letter group a name belongs to. Anything not starting with a letter —
 * a user-added `123 Gourd`, say — buckets under `#` so it still gets a header.
 */
export function plantNameSectionLetter(name: string): string {
  const first = name.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : '#';
}

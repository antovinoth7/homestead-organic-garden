/**
 * Location string helpers.
 *
 * `Plant.location` is a single free-text field holding "Parent - Child"
 * (e.g. "Home farm - Bed 3"). These parse, build and normalise it.
 *
 * They live here rather than in `useLocationManager` so the data layer can use
 * them: that hook imports React Native's `Alert` and the Firebase-backed
 * location/plant services, which anything unit-tested or service-side must not
 * pull in. `useLocationManager` re-exports these for its existing call sites.
 *
 * Its profile predicates (`hasProfileData`, `hasSoilData`) stay in the hook —
 * they are UI concerns, not part of the location-string contract.
 */

import { sanitizeLandmarkText } from '@/utils/textSanitizer';

/**
 * Splits "Parent - Child" into its parts. A location carrying extra separators
 * ("A - B - C") keeps everything after the first as the child, so a child name
 * containing " - " survives a round-trip through `buildLocation`.
 */
export const parseLocation = (value?: string | null): { parent: string; child: string } => {
  if (!value) return { parent: '', child: '' };
  const parts = value.split(' - ');
  const parent = parts[0]?.trim() ?? '';
  const child = parts.slice(1).join(' - ').trim();
  return { parent, child };
};

export const buildLocation = (parent: string, child: string): string => {
  if (parent && child) return `${parent} - ${child}`;
  return parent || child || '';
};

export const sanitizeLocationName = (value: string): string => sanitizeLandmarkText(value).trim();

/**
 * Case-insensitive comparison key for a location name. `Plant.location` is free
 * text and `saveLocationConfig` only dedupes names case-insensitively — it never
 * rewrites the strings already stored on plants — so any match between a plant's
 * parent and a configured parent location has to go through this.
 */
export const locationKey = (value?: string | null): string => (value ?? '').trim().toLowerCase();

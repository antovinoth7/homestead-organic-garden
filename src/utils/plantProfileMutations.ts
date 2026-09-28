import type { PlantProfile, PlantProfiles, PlantType } from '@/types/database.types';

/**
 * The map transforms behind adding, removing and renaming a catalog entry.
 *
 * **Every removal here is a tombstone, never a `delete`.** The stored profiles
 * map reaches Firestore through `setDoc(..., { merge: true })`, and a merge
 * deep-merges nested maps: a key missing from the payload is not removed from
 * the server's copy, it is left exactly as it was. So a key deleted locally was
 * never expressed to Firestore at all, and the next `syncFromFirestore` — which
 * adopts the remote map wholesale — handed it straight back. That is why a
 * deleted plant reappeared on its own a cache-lifetime later.
 *
 * Writing a tombstone instead makes the removal an *added* key, which a merge
 * carries perfectly well. The read layer already filters tombstones out of both
 * name lists (`getPlantNamesForType`), so nothing downstream had to change.
 *
 * Pure on purpose: `defaults` is passed in rather than imported, so this module
 * stays free of the service layer and testable without Firestore or storage.
 */

/** Shallow-copies just the one category, leaving the other seven shared. */
function withCategory(profiles: PlantProfiles, type: PlantType): PlantProfiles {
  return { ...profiles, [type]: { ...profiles[type] } };
}

/** The bare record that stands in for a removed name. */
function tombstone(type: PlantType, name: string, deletedAt?: number): PlantProfile {
  const entry: PlantProfile = { plantType: type, name, isDeleted: true };
  if (deletedAt) entry.deletedAt = deletedAt;
  return entry;
}

/**
 * Removes a name from the catalog.
 *
 * Bundled and user-added entries are treated alike. A bundled name has always
 * needed the tombstone, because `DEFAULT_PLANT_PROFILES` would otherwise
 * re-inject it on the next read; a user-added one needs it for the merge reason
 * above. A user-added tombstone shows no "Restore" row, because
 * `getHiddenPlantNames` lists only names that also exist in the bundled
 * catalog — so from the user's side it is simply gone.
 */
export function applyProfileDeletion(
  profiles: PlantProfiles,
  type: PlantType,
  name: string,
  deletedAt?: number
): PlantProfiles {
  const updated = withCategory(profiles, type);
  updated[type][name] = tombstone(type, name, deletedAt);
  return updated;
}

/**
 * Un-hides a tombstoned bundled entry by writing the bundled record back over
 * the tombstone, rather than removing the key.
 *
 * Removing it would hit the same merge wall from the other side: the server
 * would keep `isDeleted: true` and the next sync would re-hide the plant the
 * user just restored. Writing the record is the only un-hide a merge can carry.
 *
 * The restored entry is therefore a *snapshot* of the bundled data as it stands
 * today; a later app update that revises that plant's description or Tamil name
 * will not show through until a repair migration touches it, the same trade
 * `011_repair_stale_tamil_names` already makes.
 */
export function applyProfileRestore(
  profiles: PlantProfiles,
  defaults: PlantProfiles,
  type: PlantType,
  name: string
): PlantProfiles {
  const updated = withCategory(profiles, type);
  const bundled = defaults[type]?.[name];
  if (bundled) {
    updated[type][name] = { ...bundled };
  } else {
    // Unreachable from the UI — the hidden-plants list offers only bundled
    // names — but a user-added tombstone has no record to restore, so the key
    // goes. Nothing on the server needs it gone: the name is already absent
    // from the bundled catalog, so no read re-injects it.
    delete updated[type][name];
  }
  return updated;
}

/**
 * Renames an entry: the new name is written and the old one is tombstoned.
 *
 * Deleting the old key broke this twice over. Remotely the old name survived
 * the merge and came back on the next sync, leaving the plant filed under both
 * names. Locally it was worse for a bundled name — with the key gone,
 * `getPlantNamesForType` re-injected it from the bundled catalog immediately,
 * so renaming "Tomato" produced "Tomato" *and* "Tomatoes" with no sync at all.
 */
export function applyProfileRename(
  profiles: PlantProfiles,
  type: PlantType,
  from: string,
  to: string,
  data: Omit<PlantProfile, 'plantType' | 'name'>,
  deletedAt?: number
): PlantProfiles {
  const updated = withCategory(profiles, type);
  updated[type][to] = { plantType: type, name: to, ...data };
  if (from !== to) updated[type][from] = tombstone(type, from, deletedAt);
  return updated;
}

/**
 * Marks a tombstone as permanently removed, so it stops being offered for
 * restore. The bundled record itself ships with the app and cannot be erased —
 * what becomes permanent is the hiding.
 */
export function applyProfileDismissal(
  profiles: PlantProfiles,
  type: PlantType,
  name: string
): PlantProfiles {
  const existing = profiles[type]?.[name];
  if (!existing?.isDeleted) return profiles;
  const updated = withCategory(profiles, type);
  updated[type][name] = { ...existing, isDismissed: true };
  return updated;
}

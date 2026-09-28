import type { DiseaseEntry, PestEntry } from '@/types/database.types';

export type PestDiseasePickerEntry = PestEntry | DiseaseEntry;

export type PestDiseasePickerRow =
  | { kind: 'label'; key: string; label: string }
  | { kind: 'entry'; key: string; entry: PestDiseasePickerEntry; categoryLabel: string };

export interface PestDiseasePickerGroup {
  label: string;
  entries: readonly PestDiseasePickerEntry[];
}

/**
 * Flattens category groups into the picker's list rows: a header per group,
 * then its entries. Entries already linked to the plant (case-insensitive) and
 * entries not matching the query are dropped, and a group left empty loses its
 * header too, so a search never shows a heading with nothing under it.
 */
export function buildPestDiseasePickerRows(
  groups: readonly PestDiseasePickerGroup[],
  takenNames: readonly string[],
  query: string
): PestDiseasePickerRow[] {
  const taken = new Set(takenNames.map((name) => name.trim().toLowerCase()));
  const q = query.trim().toLowerCase();
  const rows: PestDiseasePickerRow[] = [];

  for (const group of groups) {
    const members = group.entries.filter((entry) => {
      const name = entry.name.toLowerCase();
      if (taken.has(name)) return false;
      if (!q) return true;
      return (
        name.includes(q) ||
        (entry.scientificName?.toLowerCase().includes(q) ?? false) ||
        (entry.tamilName?.toLowerCase().includes(q) ?? false)
      );
    });
    if (members.length === 0) continue;

    rows.push({ kind: 'label', key: `label:${group.label}`, label: group.label });
    for (const entry of members) {
      rows.push({ kind: 'entry', key: entry.id, entry, categoryLabel: group.label });
    }
  }
  return rows;
}

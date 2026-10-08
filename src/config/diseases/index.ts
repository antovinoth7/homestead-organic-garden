/**
 * Disease reference registry.
 * Exposes zone-specific disease data via lookup functions.
 */

import type { DiseaseEntry, DiseaseCategory } from '@/types/database.types';
import { KANYAKUMARI_DISEASES } from './kanyakumari';

// ─── Registry ────────────────────────────────────────────────────────────────

const ALL_DISEASES: DiseaseEntry[] = KANYAKUMARI_DISEASES;

const DISEASE_BY_ID = new Map<string, DiseaseEntry>(ALL_DISEASES.map((d) => [d.id, d]));

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function getAllDiseases(): DiseaseEntry[] {
  return ALL_DISEASES;
}

export function getDiseaseById(id: string): DiseaseEntry | undefined {
  return DISEASE_BY_ID.get(id);
}

export function getDiseaseByName(name: string): DiseaseEntry | undefined {
  const normalised = name.trim().toLowerCase();
  return ALL_DISEASES.find((d) => d.name.toLowerCase() === normalised);
}

export interface DiseaseCategoryGroup {
  category: DiseaseCategory;
  label: string;
  diseases: DiseaseEntry[];
}

const CATEGORY_LABELS: Record<DiseaseCategory, string> = {
  fungal: 'Fungal Diseases',
  bacterial: 'Bacterial Diseases',
  viral: 'Viral Diseases',
  phytoplasma: 'Phytoplasma Diseases',
  physiological: 'Physiological Disorders',
};

const CATEGORY_ORDER: DiseaseCategory[] = [
  'fungal',
  'bacterial',
  'viral',
  'phytoplasma',
  'physiological',
];

export function getGroupedDiseaseEntries(): DiseaseCategoryGroup[] {
  const groups: Partial<Record<DiseaseCategory, DiseaseEntry[]>> = {};

  for (const disease of ALL_DISEASES) {
    const list = groups[disease.category] ?? [];
    list.push(disease);
    groups[disease.category] = list;
  }

  return CATEGORY_ORDER.filter((cat) => groups[cat] && groups[cat]!.length > 0).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    diseases: groups[cat]!,
  }));
}

export function getCategoryLabel(category: DiseaseCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

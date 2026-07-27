import type { OrganicControlItem, RiskLevel } from '@/types/database.types';

/**
 * Structural shape shared by `PestEntry` and `DiseaseEntry` — identical apart
 * from the `category` union. The reference list/detail views are written
 * against this so pests and diseases render from one implementation.
 */
export interface ReferenceEntry {
  id: string;
  name: string;
  tamilName?: string;
  scientificName?: string;
  category: string;
  emoji: string;
  identification: string;
  damageDescription: string;
  organicPrevention: string[];
  organicTreatments: OrganicControlItem[];
  seasonalRisk?: Partial<Record<string, RiskLevel>>;
  plantsAffected: string[];
  imageAsset?: string;
}

/** A grouped registry bundle as returned by `getGrouped{Pest,Disease}Entries`. */
export interface ReferenceGroup {
  category: string;
  label: string;
  entries: ReferenceEntry[];
}

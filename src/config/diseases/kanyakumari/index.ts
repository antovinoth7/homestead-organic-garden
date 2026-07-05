/**
 * Disease reference data for the Kanyakumari / High Rainfall agro-climatic zone.
 *
 * Consolidates existing scattered data from plantHelpers.ts
 * (DISEASE_CATEGORY_MAP, ORGANIC_TREATMENTS, TREATMENT_DETAILS,
 * TAMIL_NADU_COMMON_PESTS_DISEASES, TAMIL_NADU_CROP_SPECIFIC_ISSUES)
 * into structured DiseaseEntry objects for the reference screens.
 */

import type { DiseaseEntry } from '@/types/database.types';

import { BACTERIAL_DISEASES } from './bacterial';
import { FUNGAL_DISEASES_1 } from './fungal1';
import { FUNGAL_DISEASES_2 } from './fungal2';
import { PHYSIOLOGICAL_DISEASES } from './physiological';
import { VIRAL_DISEASES } from './viral';

export const KANYAKUMARI_DISEASES: DiseaseEntry[] = [
  ...FUNGAL_DISEASES_1,
  ...FUNGAL_DISEASES_2,
  ...BACTERIAL_DISEASES,
  ...VIRAL_DISEASES,
  ...PHYSIOLOGICAL_DISEASES,
];

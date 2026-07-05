/**
 * Pest reference data for the Kanyakumari / High Rainfall agro-climatic zone.
 *
 * Consolidates existing scattered data from plantHelpers.ts
 * (PEST_CATEGORY_MAP, ORGANIC_TREATMENTS, TREATMENT_DETAILS,
 * TAMIL_NADU_COMMON_PESTS_DISEASES, TAMIL_NADU_CROP_SPECIFIC_ISSUES)
 * into structured PestEntry objects for the reference screens.
 */

import type { PestEntry } from '@/types/database.types';

import { BEETLE_WEEVIL_PESTS } from './beetlesWeevils';
import { BORER_LARVAE_PESTS } from './borersLarvae';
import { MITE_PESTS } from './mites';
import { OTHER_PESTS } from './other';
import { SAP_SUCKING_PESTS } from './sapSucking';

export const KANYAKUMARI_PESTS: PestEntry[] = [
  ...SAP_SUCKING_PESTS,
  ...MITE_PESTS,
  ...BORER_LARVAE_PESTS,
  ...BEETLE_WEEVIL_PESTS,
  ...OTHER_PESTS,
];

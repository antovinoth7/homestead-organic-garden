/**
 * Pure functions for pre-monsoon task scheduling.
 * Kept separate from services/tasks.ts to avoid Firebase dependency in tests.
 */

import { PRE_MONSOON_TASKS } from '@/config/organicInputs/seasonalAdaptations';

export interface PreMonsoonTaskItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

/**
 * Calculate days remaining until SW Monsoon onset (June 1).
 * Returns negative if already past June 1 this year.
 */
export function getDaysToSWMonsoon(today?: Date): number {
  const d = today ?? new Date();
  const year = d.getFullYear();
  const monsoonStart = new Date(year, 5, 1); // June 1
  const diffMs = monsoonStart.getTime() - d.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns pre-monsoon preparation tasks when within 21 days of SW Monsoon (June 1).
 * Returns empty array if not within the window.
 */
export function getPreMonsoonTasks(daysToSWMonsoon: number): PreMonsoonTaskItem[] {
  if (daysToSWMonsoon > 21 || daysToSWMonsoon < 0) return [];
  return PRE_MONSOON_TASKS as PreMonsoonTaskItem[];
}

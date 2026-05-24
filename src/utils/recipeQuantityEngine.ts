/**
 * Pure function to scale organic input recipe ingredient quantities
 * based on the user's farm configuration (land area in cents).
 */

import type { OrganicInputRecipe, RecipeIngredient } from '@/config/organicInputs';

export interface ScaledIngredient {
  name: string;
  quantity: number;
  unit: string;
  notes?: string;
}

/**
 * Scales a recipe's ingredient quantities by land area in cents.
 * Returns an array of scaled ingredients with formatted quantities.
 *
 * @param recipe - The organic input recipe to scale
 * @param landCents - Farm land area in cents (1 cent = 40.47 sqm)
 * @returns Array of ingredients with scaled quantities
 */
export function scaleRecipe(recipe: OrganicInputRecipe, landCents: number): ScaledIngredient[] {
  const effectiveCents = Math.max(0, landCents);

  return recipe.ingredients
    .filter((ing: RecipeIngredient) => ing.baseQtyPerCent > 0)
    .map((ing: RecipeIngredient) => ({
      name: ing.name,
      quantity: Math.round(ing.baseQtyPerCent * effectiveCents * 10) / 10,
      unit: ing.unit,
      notes: ing.notes,
    }));
}

/**
 * Format a scaled quantity for display (e.g., "10.5 L", "2 kg").
 */
export function formatQuantity(quantity: number, unit: string): string {
  if (quantity === 0) return `0 ${unit}`;
  if (quantity >= 100) return `${Math.round(quantity)} ${unit}`;
  if (Number.isInteger(quantity)) return `${quantity} ${unit}`;
  return `${quantity.toFixed(1)} ${unit}`;
}

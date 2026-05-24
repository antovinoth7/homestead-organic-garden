import { ORGANIC_RECIPES, getRecipeById } from '@/config/organicInputs/recipes';
import type { RecipeId } from '@/config/organicInputs/recipes';

describe('Organic Input Recipes — Config Data', () => {
  it('should have exactly 4 recipes', () => {
    expect(ORGANIC_RECIPES).toHaveLength(4);
  });

  it('should have unique IDs', () => {
    const ids = ORGANIC_RECIPES.map((r) => r.id);
    expect(new Set(ids).size).toBe(4);
  });

  const RECIPE_IDS: RecipeId[] = ['jeevamrutha', 'beejamrutha', 'panchagavya', 'vermiwash'];

  it.each(RECIPE_IDS)('recipe "%s" has required fields', (id) => {
    const recipe = getRecipeById(id);
    expect(recipe).toBeDefined();
    expect(recipe!.name).toBeTruthy();
    expect(recipe!.tamilName).toBeTruthy();
    expect(recipe!.description).toBeTruthy();
    expect(recipe!.whenToApply).toBeTruthy();
    expect(recipe!.seasonMapping.length).toBeGreaterThan(0);
  });

  it.each(RECIPE_IDS)('recipe "%s" has at least 2 ingredients', (id) => {
    const recipe = getRecipeById(id)!;
    expect(recipe.ingredients.length).toBeGreaterThanOrEqual(2);
  });

  it.each(RECIPE_IDS)('recipe "%s" has non-empty preparation steps', (id) => {
    const recipe = getRecipeById(id)!;
    expect(recipe.preparationSteps.length).toBeGreaterThanOrEqual(3);
    recipe.preparationSteps.forEach((step) => {
      expect(step.length).toBeGreaterThan(10);
    });
  });

  it.each(RECIPE_IDS)('recipe "%s" has valid season mapping', (id) => {
    const recipe = getRecipeById(id)!;
    const validSeasons = ['summer', 'sw_monsoon', 'ne_monsoon', 'cool_dry'];
    recipe.seasonMapping.forEach((s) => {
      expect(validSeasons).toContain(s);
    });
  });

  it.each(RECIPE_IDS)(
    'recipe "%s" ingredients have positive baseQtyPerCent or are zero (reusable items)',
    (id) => {
      const recipe = getRecipeById(id)!;
      recipe.ingredients.forEach((ing) => {
        expect(ing.baseQtyPerCent).toBeGreaterThanOrEqual(0);
        expect(ing.name).toBeTruthy();
        expect(ing.unit).toBeTruthy();
      });
    }
  );

  it('getRecipeById returns undefined for unknown ID', () => {
    expect(getRecipeById('unknown' as RecipeId)).toBeUndefined();
  });
});

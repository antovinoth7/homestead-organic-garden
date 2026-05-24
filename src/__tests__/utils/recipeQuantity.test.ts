import { scaleRecipe, formatQuantity } from '@/utils/recipeQuantityEngine';
import { getRecipeById } from '@/config/organicInputs/recipes';

describe('Recipe Quantity Engine', () => {
  const jeevamrutha = getRecipeById('jeevamrutha')!;

  describe('scaleRecipe', () => {
    it('scales ingredients by land_cents correctly', () => {
      const scaled = scaleRecipe(jeevamrutha, 5);
      // Cow dung: baseQtyPerCent=2, 2*5=10
      const cowDung = scaled.find((i) => i.name === 'Desi cow dung');
      expect(cowDung).toBeDefined();
      expect(cowDung!.quantity).toBe(10);
      expect(cowDung!.unit).toBe('kg');
    });

    it('handles 1 cent (minimum reasonable farm)', () => {
      const scaled = scaleRecipe(jeevamrutha, 1);
      const water = scaled.find((i) => i.name === 'Water');
      expect(water).toBeDefined();
      // Water baseQtyPerCent=40, 40*1=40
      expect(water!.quantity).toBe(40);
    });

    it('handles 0 cents (edge case)', () => {
      const scaled = scaleRecipe(jeevamrutha, 0);
      scaled.forEach((ing) => {
        expect(ing.quantity).toBe(0);
      });
    });

    it('handles large farm (100 cents)', () => {
      const scaled = scaleRecipe(jeevamrutha, 100);
      const cowDung = scaled.find((i) => i.name === 'Desi cow dung');
      // 2 * 100 = 200
      expect(cowDung!.quantity).toBe(200);
    });

    it('handles negative cents gracefully (treated as 0)', () => {
      const scaled = scaleRecipe(jeevamrutha, -5);
      scaled.forEach((ing) => {
        expect(ing.quantity).toBe(0);
      });
    });

    it('filters out zero-baseQty ingredients (reusable items)', () => {
      const vermiwash = getRecipeById('vermiwash')!;
      const scaled = scaleRecipe(vermiwash, 5);
      // Collection container has baseQtyPerCent=0, should be filtered
      const container = scaled.find((i) => i.name === 'Collection container');
      expect(container).toBeUndefined();
    });

    it('rounds to 1 decimal place', () => {
      // Lime powder baseQtyPerCent=0.1, 0.1 * 3 = 0.3
      const beejamrutha = getRecipeById('beejamrutha')!;
      const scaled = scaleRecipe(beejamrutha, 3);
      const lime = scaled.find((i) => i.name === 'Lime powder');
      expect(lime!.quantity).toBe(0.3);
    });
  });

  describe('formatQuantity', () => {
    it('formats integer quantities', () => {
      expect(formatQuantity(10, 'kg')).toBe('10 kg');
    });

    it('formats decimal quantities with one decimal place', () => {
      expect(formatQuantity(2.5, 'L')).toBe('2.5 L');
    });

    it('formats large quantities as rounded integers', () => {
      expect(formatQuantity(150.7, 'L')).toBe('151 L');
    });

    it('formats zero', () => {
      expect(formatQuantity(0, 'kg')).toBe('0 kg');
    });
  });
});

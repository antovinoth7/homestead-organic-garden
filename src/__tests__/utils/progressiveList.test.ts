import { paginateList } from '@/utils/progressiveList';

const ITEMS = Array.from({ length: 25 }, (_, i) => `item-${i}`);

describe('paginateList', () => {
  it('reports nothing to disclose when the list is shorter than the window', () => {
    const page = paginateList(ITEMS.slice(0, 5), 8, 8);
    expect(page.visible).toHaveLength(5);
    expect(page.remaining).toBe(0);
    expect(page.canCollapse).toBe(false);
  });

  it('shows no footer state when the list exactly fills the initial window', () => {
    const page = paginateList(ITEMS.slice(0, 8), 8, 8);
    expect(page.visible).toHaveLength(8);
    expect(page.remaining).toBe(0);
    expect(page.canCollapse).toBe(false);
  });

  it('caps the window and reports the remainder', () => {
    const page = paginateList(ITEMS, 8, 8);
    expect(page.visible).toHaveLength(8);
    expect(page.remaining).toBe(17);
    expect(page.canCollapse).toBe(false);
  });

  it('allows collapsing once the window has grown past its initial size', () => {
    const page = paginateList(ITEMS, 18, 8);
    expect(page.visible).toHaveLength(18);
    expect(page.remaining).toBe(7);
    expect(page.canCollapse).toBe(true);
  });

  it('offers collapse but no further expansion when fully expanded', () => {
    const page = paginateList(ITEMS, 28, 8);
    expect(page.visible).toHaveLength(25);
    expect(page.remaining).toBe(0);
    expect(page.canCollapse).toBe(true);
  });

  it('returns a prefix slice so indexes match the source array', () => {
    // Load-bearing for PlantPicturesSection: a rendered cell's index is used
    // to open the zoom viewer against the *full* uri list.
    const page = paginateList(ITEMS, 12, 12);
    page.visible.forEach((item, index) => {
      expect(item).toBe(ITEMS[index]);
    });
  });

  it('treats a negative window as empty rather than slicing from the end', () => {
    const page = paginateList(ITEMS, -5, 8);
    expect(page.visible).toHaveLength(0);
    expect(page.remaining).toBe(25);
    expect(page.canCollapse).toBe(false);
  });

  it('handles an empty list', () => {
    const page = paginateList([], 8, 8);
    expect(page.visible).toHaveLength(0);
    expect(page.remaining).toBe(0);
    expect(page.canCollapse).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { appendPage, hasFullPage, nextOffset, PAGE_SIZE, pageQuery, shouldLoadMore } from './page';

describe('people pages', () => {
  it('prefetches twenty and loads the next twenty at the second-to-last item', () => {
    expect(PAGE_SIZE).toBe(20);
    expect(pageQuery(0)).toEqual({ limit: 20, offset: 0 });
    expect(pageQuery(20)).toEqual({ limit: 20, offset: 20 });
    expect(nextOffset(20)).toBe(20);
    expect(hasFullPage(20)).toBe(true);
    expect(hasFullPage(7)).toBe(false);
    expect(shouldLoadMore(18, 20, true)).toBe(true);
    expect(shouldLoadMore(19, 20, true)).toBe(true);
    expect(shouldLoadMore(17, 20, true)).toBe(false);
    expect(shouldLoadMore(18, 20, false)).toBe(false);
    expect(shouldLoadMore(0, 1, true)).toBe(false);
  });

  it('appends the next page without duplicating someone already loaded', () => {
    const first = [{ id: 'a' }, { id: 'b' }];
    const next = [{ id: 'b' }, { id: 'c' }];
    expect(appendPage(first, next, (item) => item.id)).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  });
});

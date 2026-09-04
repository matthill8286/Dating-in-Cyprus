export const PAGE_SIZE = 20;

export function pageQuery(offset: number): { limit: number; offset: number } {
  return { limit: PAGE_SIZE, offset };
}

export function shouldLoadMore(index: number, loaded: number, hasMore: boolean): boolean {
  if (!hasMore || loaded < 2 || index < 0) return false;
  return index >= loaded - 2;
}

export function nextOffset(loaded: number): number {
  return loaded;
}

export function appendPage<T>(prev: T[], next: T[], id: (item: T) => string): T[] {
  const seen = new Set(prev.map(id));
  return [...prev, ...next.filter((item) => !seen.has(id(item)))];
}

export function hasFullPage(count: number): boolean {
  return count === PAGE_SIZE;
}

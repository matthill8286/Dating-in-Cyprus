import { describe, expect, it } from 'vitest';
import { introPending } from './pending';

describe('loading skeletons', () => {
  it('covers the first fetch, Ask, and Yes or Not this on a slow network', () => {
    expect(introPending(false, false, false)).toBe(true);
    expect(introPending(true, true, false)).toBe(true);
    expect(introPending(true, false, true)).toBe(true);
    expect(introPending(true, false, false)).toBe(false);
  });
});

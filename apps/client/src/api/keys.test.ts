import { describe, expect, it } from 'vitest';
import { keys } from './keys';

describe('query keys', () => {
  it('names each feed once so a mutation can invalidate only what it changed', () => {
    expect(keys.intro()).toEqual(['intro']);
    expect(keys.pool()).toEqual(['pool']);
    expect(keys.matches()).toEqual(['matches']);
    expect(keys.me()).toEqual(['me']);
  });

  it('keeps one thread per match', () => {
    expect(keys.messages('m-1')).toEqual(['messages', 'm-1']);
    expect(keys.messages('m-1')).not.toEqual(keys.messages('m-2'));
  });
});

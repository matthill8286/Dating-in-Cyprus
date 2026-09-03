import { describe, expect, it } from 'vitest';
import { pageOn } from './layout';

describe('mobile-first page', () => {
  it('fills a phone and only columns on web', () => {
    expect(pageOn('ios')).toEqual({ width: '100%' });
    expect(pageOn('android')).toEqual({ width: '100%' });
    expect(pageOn('web')).toEqual({ width: '100%', maxWidth: 430, alignSelf: 'center' });
  });
});

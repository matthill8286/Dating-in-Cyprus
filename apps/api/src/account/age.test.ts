import { describe, expect, it } from 'vitest';
import { ageInYears } from './age';

describe('ageInYears', () => {
  const now = new Date('2026-08-28T12:00:00.000Z');

  it('is 21 on the 21st birthday', () => {
    expect(ageInYears('2005-08-28', now)).toBe(21);
  });

  it('is 20 the day before the 21st birthday', () => {
    expect(ageInYears('2005-08-29', now)).toBe(20);
  });

  it('is not an age when the date is not a day', () => {
    expect(ageInYears('not-a-date', now)).toBe(-1);
  });
});

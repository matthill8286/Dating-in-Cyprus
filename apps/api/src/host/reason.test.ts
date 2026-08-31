import { describe, expect, it } from 'vitest';
import {
  introductionReason,
  isFresh,
  meetFraming,
  pickFromPool,
  sharedLanguage,
} from './reason';

const alex = { city: 'Limassol' as const, languagesSpoken: ['en'] as const };
const elena = { firstName: 'Elena', city: 'Limassol' as const, languagesSpoken: ['en'] as const };
const maria = { firstName: 'Maria', city: 'Nicosia' as const, languagesSpoken: ['ro', 'en'] as const };
const ioana = { firstName: 'Ioana', city: 'Paphos' as const, languagesSpoken: ['ro'] as const };

describe('introduction reason', () => {
  it('states shared city and language from Profile facts only', () => {
    expect(introductionReason(alex, elena)).toBe(
      'You both live in Limassol, and you both speak English.',
    );
    expect(introductionReason(alex, maria)).toBe(
      'Maria lives in Nicosia. You both speak English.',
    );
    expect(introductionReason(alex, ioana)).toBe('Ioana lives in Paphos.');
    expect(introductionReason({ ...alex, languagesSpoken: ['bg'] }, elena)).toBe(
      'You both live in Limassol.',
    );
    expect(introductionReason(alex, { ...elena, bio: 'Shipping by week, the marina at the weekend.' })).toMatch(
      /Elena writes, “Shipping by week, the marina at the weekend.”/,
    );
  });

  it('frames an evening in the other person’s city, not a GPS distance', () => {
    expect(meetFraming('Limassol')).toMatch(/sea path/);
    expect(meetFraming('Nicosia')).toMatch(/old town/);
    expect(sharedLanguage(['en', 'ru'], ['uk', 'ru'])).toBe('ru');
    expect(sharedLanguage(['en'], ['uk'])).toBeUndefined();
  });

  it('prefers someone in the same city from the Pool', () => {
    const picked = pickFromPool([maria, elena, ioana], 'Limassol');
    expect(picked?.firstName).toBe('Elena');
    expect(pickFromPool([maria], 'Limassol')?.firstName).toBe('Maria');
    expect(pickFromPool([], 'Limassol')).toBeUndefined();
    const now = new Date('2026-08-31T12:00:00.000Z');
    expect(isFresh('2026-08-31T12:00:00.000Z', now)).toBe(false);
    expect(isFresh('2026-08-31T12:00:01.000Z', now)).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { chooseFromPool, matchScore, tokens } from './score';

const alex = {
  city: 'Limassol' as const,
  languagesSpoken: ['en'] as const,
  bio: 'Limassol harbour side. Here for the long run.',
};

const elena = {
  firstName: 'Elena',
  city: 'Limassol' as const,
  languagesSpoken: ['en'] as const,
  bio: 'Limassol resident. Shipping by week, the marina at the weekend.',
};

const alina = {
  firstName: 'Alina',
  city: 'Paphos' as const,
  languagesSpoken: ['ru', 'en'] as const,
  bio: 'Paphos harbour walks. I stayed after the first winter.',
};

describe('host matching', () => {
  it('scores a want against city, language, and the written bio — not an invented job', () => {
    expect(tokens('Paphos harbour walks').includes('harbour')).toBe(true);
    expect(matchScore(alex, alina, 'harbour walks')).toBeGreaterThan(
      matchScore(alex, elena, 'harbour walks'),
    );
    expect(chooseFromPool([elena, alina], alex, 'Paphos harbour')?.firstName).toBe('Alina');
    expect(chooseFromPool([elena, alina], alex)?.firstName).toBe('Elena');
    expect(chooseFromPool([elena, alina], alex, '25, russian, fun')?.firstName).toBe('Alina');
    expect(chooseFromPool([], alex)).toBeUndefined();
  });

  it('offers whoever speaks one of the named languages, preferring whoever speaks both', () => {
    const want = 'Russian that speaks English';
    // Elena speaks only English of the two, but a half match still beats an empty Host tab.
    expect(chooseFromPool([elena], alex, want)?.firstName).toBe('Elena');
    // Alina speaks both, so she still comes first when both are on the island.
    expect(chooseFromPool([elena, alina], alex, want)?.firstName).toBe('Alina');
    expect(matchScore(alex, alina, want)).toBeGreaterThan(matchScore(alex, elena, want));
    // Someone who speaks neither is still left out.
    const bogdan = {
      firstName: 'Bogdan',
      city: 'Nicosia' as const,
      languagesSpoken: ['bg'] as const,
      bio: 'Nicosia old town.',
    };
    expect(chooseFromPool([bogdan], alex, want)).toBeUndefined();
  });
});

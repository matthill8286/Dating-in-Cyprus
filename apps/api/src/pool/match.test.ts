import { describe, expect, it } from 'vitest';
import { accountsMatch } from './match';
import type { Account } from '../account/store';

function person(
  id: string,
  gender: Account['gender'],
  seeking: Account['seeking'],
): Account {
  return {
    id,
    email: `${id}@example.com`,
    passwordHash: 'x',
    dateOfBirth: '2000-01-01',
    launchLanguage: 'en',
    gender,
    seeking,
    mobile: '+35799123456',
    residentAdmitted: true,
  };
}

describe('accountsMatch', () => {
  it('lets a man seeking women see a woman seeking men', () => {
    expect(accountsMatch(person('m', 'man', 'women'), person('w', 'woman', 'men'))).toBe(
      true,
    );
  });

  it('does not show another man to a man seeking women', () => {
    expect(accountsMatch(person('m1', 'man', 'women'), person('m2', 'man', 'women'))).toBe(
      false,
    );
  });

  it('does not show a person to themselves', () => {
    const viewer = person('m', 'man', 'women');
    expect(accountsMatch(viewer, viewer)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { afterDecision, filterDeck, interestMatched, type MatchedCard } from './match';
import type { Profile } from './profile';

const elena: Profile = {
  profileId: 'p1',
  accountId: 'a1',
  firstName: 'Elena',
  age: 29,
  city: 'Limassol',
  languagesSpoken: ['en'],
  bio: 'Marina.',
  photos: [],
};

const maria: Profile = {
  ...elena,
  profileId: 'p2',
  firstName: 'Maria',
  city: 'Nicosia',
};

describe('discovery deck', () => {
  it('filters by city and removes a decided card', () => {
    expect(filterDeck([elena, maria], 'all')).toHaveLength(2);
    expect(filterDeck([elena, maria], 'Limassol')).toEqual([elena]);
    expect(afterDecision([elena, maria], 'p1')).toEqual([maria]);
  });

  it('only opens a Match overlay when Interest is mutual', () => {
    expect(interestMatched({ matched: false }, elena)).toBeNull();
    expect(interestMatched({ matched: true }, elena)).toBeNull();
    const opened = interestMatched({ matched: true, matchId: 'm1' }, elena) as MatchedCard;
    expect(opened.matchId).toBe('m1');
    expect(opened.profile.firstName).toBe('Elena');
  });
});

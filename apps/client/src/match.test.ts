import { describe, expect, it } from 'vitest';
import { afterDecision, bioHasMore, deckTap, filterDeck, interestMatched, nextPhotoIndex, photoTap, searchInbox, splitInbox, swipeDecision, type MatchedCard } from './match';
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
  it('filters by city, age band, and removes a decided card', () => {
    expect(filterDeck([elena, maria], 'all')).toHaveLength(2);
    expect(filterDeck([elena, maria], 'Limassol')).toEqual([elena]);
    expect(filterDeck([elena, { ...maria, age: 42 }], 'all', 21, 29)).toEqual([elena]);
    expect(afterDecision([elena, maria], 'p1')).toEqual([maria]);
  });

  it('only opens a Match overlay when Interest is mutual', () => {
    expect(interestMatched({ matched: false }, elena)).toBeNull();
    expect(interestMatched({ matched: true }, elena)).toBeNull();
    const opened = interestMatched({ matched: true, matchId: 'm1' }, elena) as MatchedCard;
    expect(opened.matchId).toBe('m1');
    expect(opened.profile.firstName).toBe('Elena');
  });

  it('swipes right to like, left to pass, and taps to change photo', () => {
    expect(swipeDecision(120)).toBe('like');
    expect(swipeDecision(-120)).toBe('pass');
    expect(swipeDecision(20)).toBeNull();
    expect(nextPhotoIndex(0, 3, 1)).toBe(1);
    expect(nextPhotoIndex(2, 3, 1)).toBe(0);
    expect(nextPhotoIndex(0, 3, -1)).toBe(2);
    expect(photoTap(20, 300)).toBe(-1);
    expect(photoTap(200, 300)).toBe(1);
    expect(deckTap(20, 50, 300, 400)).toBe('photo-prev');
    expect(deckTap(200, 50, 300, 400)).toBe('photo-next');
    expect(deckTap(150, 320, 300, 400)).toBe('open');
  });

  it('splits new Matches from threads that already have a message', () => {
    const fresh = { matchId: 'm1', profile: elena, lastMessage: null };
    const thread = {
      matchId: 'm2',
      profile: maria,
      lastMessage: { body: 'Hello from Limassol', fromMe: true, sentAt: '2026-08-28T12:00:00.000Z' },
    };
    expect(splitInbox([fresh, thread])).toEqual({ fresh: [fresh], threads: [thread] });
    expect(searchInbox([fresh, thread], 'mar')).toEqual([thread]);
    expect(searchInbox([fresh, thread], '')).toHaveLength(2);
    expect(bioHasMore('Marina.')).toBe(false);
    expect(bioHasMore('x'.repeat(111))).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  bioHasMore,
  matchGridWidth,
  matchTileSize,
  nextPhotoIndex,
  photoTap,
  searchInbox,
  splitInbox,
} from './match';
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

describe('discovery', () => {
  it('taps left and right to change photo, wrapping at each end', () => {
    expect(nextPhotoIndex(0, 3, 1)).toBe(1);
    expect(nextPhotoIndex(2, 3, 1)).toBe(0);
    expect(nextPhotoIndex(0, 3, -1)).toBe(2);
    expect(nextPhotoIndex(0, 0, 1)).toBe(0);
    expect(photoTap(20, 300)).toBe(-1);
    expect(photoTap(200, 300)).toBe(1);
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

  it('sizes Match tiles in points so a wrapping grid cannot collapse them', () => {
    expect(matchGridWidth(390)).toBe(350);
    expect(matchGridWidth(800)).toBe(760);
    expect(matchGridWidth(800, 430)).toBe(390);
    expect(matchTileSize(350)).toEqual({ width: 169, height: 217 });
    expect(matchTileSize(0)).toEqual({ width: 0, height: 0 });
  });
});

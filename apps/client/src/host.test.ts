import { describe, expect, it } from 'vitest';
import {
  asIntroduction,
  canDecide,
  HOST_EMPTY,
  HOST_OPENING,
  hostLines,
  spokenList,
  verificationCopy,
  type HostIntroduction,
} from './host';

const elena: HostIntroduction = {
  introductionId: 'intro-1',
  profileId: 'p1',
  firstName: 'Elena',
  city: 'Limassol',
  languagesSpoken: ['en'],
  photoVerification: 'verified',
  reason: 'You both live in Limassol, and you both speak English.',
  meetFraming: 'An evening walk along the sea path, then somewhere quiet for a drink.',
  portraitUrl: 'https://example.com/elena.jpg',
  bio: 'Limassol resident.',
  expiresAt: '2026-08-31T12:00:00.000Z',
};

describe('host thread', () => {
  it('opens with Here, then one Introduction — not a swipe deck', () => {
    const lines = hostLines({ introduction: elena, revealed: false, verb: null, matched: null });
    expect(lines[0]).toEqual({ id: 'open', kind: 'host', body: HOST_OPENING });
    expect(lines[1]).toMatchObject({ kind: 'intro', revealed: false });
    expect(JSON.stringify(lines)).not.toMatch(/like|nope|swipe/i);
    const asked = hostLines({
      introduction: elena,
      revealed: false,
      verb: null,
      matched: null,
      want: 'harbour walks',
    });
    expect(asked[1]).toEqual({ id: 'want', kind: 'you', body: 'harbour walks' });
    const looking = hostLines({
      introduction: null,
      revealed: false,
      verb: null,
      matched: null,
      want: 'harbour walks',
      looking: true,
    });
    expect(looking.map((line) => line.kind)).toEqual(['host', 'you', 'host']);
  });

  it('earns the portrait after Tell me more, and steps back after a mutual Yes', () => {
    const more = hostLines({ introduction: elena, revealed: true, verb: 'more', matched: null });
    expect(more.some((line) => line.kind === 'you' && line.body === 'Tell me more.')).toBe(true);
    const match = hostLines({
      introduction: elena,
      revealed: true,
      verb: 'yes',
      matched: { matchId: 'm1', firstName: 'Elena', profileId: 'p1' },
    });
    expect(match.map((line) => line.kind)).toEqual(['host', 'you', 'host']);
    expect(match[2]).toMatchObject({ kind: 'host' });
    if (match[2]?.kind === 'host') expect(match[2].body).toMatch(/step back/);
  });

  it('shows an empty evening when the Pool has no one left', () => {
    const lines = hostLines({ introduction: null, revealed: false, verb: null, matched: null });
    expect(lines[1]).toEqual({ id: 'empty', kind: 'host', body: HOST_EMPTY });
    expect(canDecide(elena, false, null)).toBe(true);
    expect(canDecide(null, false, null)).toBe(false);
    expect(canDecide(elena, true, null)).toBe(false);
    expect(spokenList(['en', 'uk'])).toBe('English · Ukrainian');
    expect(verificationCopy('verified')).toBe('Photo verified');
    expect(verificationCopy('unverified')).toBe('Unverified');
    expect(asIntroduction({ introduction: elena })?.firstName).toBe('Elena');
    expect(asIntroduction({ introduction: null })).toBeNull();
    expect(asIntroduction(undefined)).toBeNull();
  });
});

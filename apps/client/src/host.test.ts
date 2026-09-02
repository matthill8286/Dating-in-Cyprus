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
  it('opens with one Introduction — not a swipe deck or a repeated pitch', () => {
    const lines = hostLines({ introduction: elena, revealed: false, verb: null, matched: null });
    expect(lines.map((line) => line.kind)).toEqual(['intro']);
    expect(lines[0]).toMatchObject({ kind: 'intro', revealed: false });
    expect(JSON.stringify(lines)).not.toMatch(/like|nope|swipe/i);
    const asked = hostLines({
      introduction: elena,
      revealed: false,
      verb: null,
      matched: null,
      want: 'harbour walks',
    });
    expect(asked.map((line) => line.kind)).toEqual(['you', 'intro']);
    expect(asked[0]).toEqual({ id: 'want', kind: 'you', body: 'harbour walks' });
    const looking = hostLines({
      introduction: null,
      revealed: false,
      verb: null,
      matched: null,
      want: 'harbour walks',
      looking: true,
    });
    expect(looking.map((line) => line.kind)).toEqual(['you', 'host']);
  });

  it('earns the portrait after Tell me more, and keeps looking after a mutual Yes', () => {
    const more = hostLines({ introduction: elena, revealed: true, verb: 'more', matched: null });
    expect(more.some((line) => line.kind === 'you' && line.body === 'Tell me more.')).toBe(true);
    const opened = { matchId: 'm1', firstName: 'Elena', profileId: 'p1' };
    const match = hostLines({
      introduction: elena,
      revealed: true,
      verb: 'yes',
      matched: opened,
    });
    expect(match.some((line) => line.kind === 'intro')).toBe(false);
    const leave = match.find((line) => line.id === 'leave');
    expect(leave).toMatchObject({ kind: 'host' });
    if (leave?.kind === 'host') {
      expect(leave.body).toMatch(/keep looking/);
      expect(leave.body).toMatch(/Matches/);
      expect(leave.body).not.toMatch(/step back/);
    }
    const oksana = { ...elena, introductionId: 'intro-2', profileId: 'p2', firstName: 'Oksana' };
    const next = hostLines({ introduction: oksana, revealed: false, verb: null, matched: opened });
    expect(next.some((line) => line.kind === 'intro' && line.introduction.firstName === 'Oksana')).toBe(
      true,
    );
    expect(canDecide(elena, false, opened)).toBe(false);
    expect(canDecide(oksana, false, opened)).toBe(true);
  });

  it('shows an empty evening when the Pool has no one left', () => {
    const lines = hostLines({ introduction: null, revealed: false, verb: null, matched: null });
    expect(lines[0]).toEqual({ id: 'open', kind: 'host', body: HOST_OPENING });
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

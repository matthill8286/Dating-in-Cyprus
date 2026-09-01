import { describe, expect, it } from 'vitest';
import { chooseWithModel, parseModelChoice } from './mind';

const alex = {
  city: 'Limassol' as const,
  languagesSpoken: ['en'] as const,
  bio: 'Limassol harbour side. Here for the long run.',
};

const elena = {
  profileId: 'p-elena',
  firstName: 'Elena',
  city: 'Limassol' as const,
  languagesSpoken: ['en'] as const,
  bio: 'Limassol resident. Shipping by week, the marina at the weekend.',
};

const alina = {
  profileId: 'p-alina',
  firstName: 'Alina',
  city: 'Paphos' as const,
  languagesSpoken: ['ru', 'en'] as const,
  bio: 'Paphos harbour walks. I stayed after the first winter.',
};

function jsonReply(profileId: string) {
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ profileId }) } }],
    }),
  } as Response;
}

describe('EU host model', () => {
  it('uses a listed profileId from the model and ignores an invented id', async () => {
    expect(parseModelChoice('{"profileId":"p-alina"}', new Set(['p-alina']))).toBe('p-alina');
    expect(parseModelChoice('{"profileId":"made-up"}', new Set(['p-alina']))).toBeUndefined();
    expect(parseModelChoice('{', new Set(['p-alina']))).toBeUndefined();
    const picked = await chooseWithModel([elena, alina], alex, 'harbour', {
      url: 'https://example.test/v1',
      key: 'secret',
      name: 'gpt-4o-mini',
      fetch: async (_url, init) => {
        const headers = init.headers as Record<string, string>;
        expect(headers['api-key']).toBe('secret');
        return jsonReply('p-alina');
      },
    });
    expect(picked?.firstName).toBe('Alina');
    const fallback = await chooseWithModel([elena, alina], alex, undefined, {
      url: 'https://example.test/v1',
      fetch: async () => jsonReply('not-in-pool'),
    });
    expect(fallback?.firstName).toBe('Elena');
  });

  it('falls back to the local ranker when the model is down, times out, or unset', async () => {
    const down = await chooseWithModel([elena, alina], alex, undefined, {
      url: 'https://example.test/v1',
      fetch: async () => {
        throw new Error('down');
      },
    });
    expect(down?.firstName).toBe('Elena');
    const timedOut = await chooseWithModel([elena, alina], alex, undefined, {
      url: 'https://example.test/v1',
      timeoutMs: 20,
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    });
    expect(timedOut?.firstName).toBe('Elena');
    const local = await chooseWithModel([elena, alina], alex, 'Paphos harbour');
    expect(local?.firstName).toBe('Alina');
  });
});

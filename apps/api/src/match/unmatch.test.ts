import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { MemoryAccountStore } from '../account/store';
import { MemoryProfileStore } from '../profile/store';
import { MemoryLoopStore } from './store';

const NOW = new Date('2026-08-28T12:00:00.000Z');
let mobiles = 6000000;

function testConfig() {
  return loadConfig({
    CORS_ORIGINS: 'http://localhost:8081',
    SESSION_SECRET: 's'.repeat(32),
    NODE_ENV: 'test',
    DATA_REGION: 'westeurope',
    PHOTO_STORE_REGION: 'westeurope',
    DATABASE_URL: 'postgres://dating:dating@localhost:5432/dating',
  });
}

function nextMobile(): string {
  mobiles += 1;
  return `+3579${String(mobiles).slice(-7)}`;
}

function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

async function build() {
  return buildApp({
    config: testConfig(),
    accounts: new MemoryAccountStore(),
    profiles: new MemoryProfileStore(),
    loop: new MemoryLoopStore(),
    now: () => NOW,
  });
}

async function resident(
  app: Awaited<ReturnType<typeof build>>,
  gender: 'man' | 'woman',
  seeking: 'men' | 'women',
  firstName: string,
) {
  const join = await app.inject({
    method: 'POST',
    url: '/v1/accounts',
    payload: {
      email: `${randomUUID()}@example.com`,
      password: 'password1',
      dateOfBirth: '2005-08-28',
      launchLanguage: 'en',
      gender,
      seeking,
      specialCategoryConsent: true,
      mobile: nextMobile(),
      primaryHomeAttestation: true,
      presence: { latitude: 34.685, longitude: 33.038 },
    },
  });
  const { token } = join.json() as { token: string };
  const uploaded = await app.inject({
    method: 'POST',
    url: '/v1/profiles/me/photos',
    headers: auth(token),
    payload: { contentType: 'image/jpeg', data: Buffer.from('portrait').toString('base64') },
  });
  const photoId = (uploaded.json() as { photoId: string }).photoId;
  const saved = await app.inject({
    method: 'PATCH',
    url: '/v1/profiles/me',
    headers: auth(token),
    payload: {
      firstName,
      city: 'Limassol',
      languagesSpoken: ['en'],
      bio: 'Lives in Limassol.',
      photoIds: [photoId],
    },
  });
  return { token, profileId: (saved.json() as { profileId: string }).profileId };
}

async function openMatch(app: Awaited<ReturnType<typeof build>>) {
  const man = await resident(app, 'man', 'women', 'Alex');
  const woman = await resident(app, 'woman', 'men', 'Elena');
  await app.inject({
    method: 'POST',
    url: '/v1/interests',
    headers: auth(man.token),
    payload: { profileId: woman.profileId },
  });
  const matched = await app.inject({
    method: 'POST',
    url: '/v1/interests',
    headers: auth(woman.token),
    payload: { profileId: man.profileId },
  });
  return { man, woman, matchId: (matched.json() as { matchId: string }).matchId };
}

describe('Un-match', () => {
  it('removes the Match both ways, ends chat with 404, and leaves them in the Pool', async () => {
    const app = await build();
    const { man, woman, matchId } = await openMatch(app);
    await app.inject({
      method: 'POST',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(man.token),
      payload: { body: 'Hello' },
    });
    const cut = await app.inject({
      method: 'DELETE',
      url: `/v1/matches/${matchId}`,
      headers: auth(man.token),
    });
    expect(cut.statusCode).toBe(200);
    expect(cut.json()).toEqual({ ok: true });
    const hisList = await app.inject({ method: 'GET', url: '/v1/matches', headers: auth(man.token) });
    const herList = await app.inject({ method: 'GET', url: '/v1/matches', headers: auth(woman.token) });
    expect(hisList.json()).toEqual({ matches: [] });
    expect(herList.json()).toEqual({ matches: [] });
    const chat = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(man.token),
    });
    const send = await app.inject({
      method: 'POST',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(woman.token),
      payload: { body: 'still here?' },
    });
    expect(chat.statusCode).toBe(404);
    expect(send.statusCode).toBe(404);
    expect(chat.json()).toMatchObject({ code: 'not_found' });
    const pool = await app.inject({ method: 'GET', url: '/v1/pool', headers: auth(man.token) });
    const names = (pool.json() as { profiles: Array<{ firstName: string }> }).profiles.map(
      (item) => item.firstName,
    );
    expect(names).toContain('Elena');
    await app.close();
  });

  it('returns 404 for an outsider and keeps Block as chat_not_allowed', async () => {
    const app = await build();
    const { man, woman, matchId } = await openMatch(app);
    const outsider = await resident(app, 'man', 'women', 'Niko');
    const stolen = await app.inject({
      method: 'DELETE',
      url: `/v1/matches/${matchId}`,
      headers: auth(outsider.token),
    });
    expect(stolen.statusCode).toBe(404);
    await app.inject({
      method: 'POST',
      url: '/v1/blocks',
      headers: auth(man.token),
      payload: { profileId: woman.profileId },
    });
    const afterBlock = await app.inject({
      method: 'DELETE',
      url: `/v1/matches/${matchId}`,
      headers: auth(man.token),
    });
    expect(afterBlock.statusCode).toBe(403);
    expect(afterBlock.json()).toMatchObject({ code: 'chat_not_allowed' });
    await app.close();
  });
});

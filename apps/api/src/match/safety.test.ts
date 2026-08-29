import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { MemoryAccountStore } from '../account/store';
import { MemoryProfileStore } from '../profile/store';
import { MemoryLoopStore } from './store';

const NOW = new Date('2026-08-28T12:00:00.000Z');
let mobiles = 4000000;

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
    headers: { authorization: `Bearer ${token}` },
    payload: {
      contentType: 'image/jpeg',
      data: Buffer.from('portrait').toString('base64'),
    },
  });
  const photoId = (uploaded.json() as { photoId: string }).photoId;
  const saved = await app.inject({
    method: 'PATCH',
    url: '/v1/profiles/me',
    headers: { authorization: `Bearer ${token}` },
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

function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

function names(body: unknown): string[] {
  const { profiles } = body as { profiles: Array<{ firstName: string }> };
  return profiles.map((profile) => profile.firstName);
}

describe('Block and Report', () => {
  it('refuses a Block or Report of yourself', async () => {
    const app = await build();
    const man = await resident(app, 'man', 'women', 'Alex');
    const blocked = await app.inject({
      method: 'POST',
      url: '/v1/blocks',
      headers: auth(man.token),
      payload: { profileId: man.profileId },
    });
    expect(blocked.statusCode).toBe(403);
    const reported = await app.inject({
      method: 'POST',
      url: '/v1/reports',
      headers: auth(man.token),
      payload: { profileId: man.profileId, reason: 'fake' },
    });
    expect(reported.statusCode).toBe(403);
    await app.close();
  });

  it('hides a Block from discovery both ways and ends chat on the Match', async () => {
    const app = await build();
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
    const { matchId } = matched.json() as { matchId: string };
    const cut = await app.inject({
      method: 'POST',
      url: '/v1/blocks',
      headers: auth(man.token),
      payload: { profileId: woman.profileId },
    });
    expect(cut.statusCode).toBe(200);
    expect(cut.json()).toEqual({ ok: true });
    const hisPool = await app.inject({ method: 'GET', url: '/v1/pool', headers: auth(man.token) });
    const herPool = await app.inject({ method: 'GET', url: '/v1/pool', headers: auth(woman.token) });
    expect(names(hisPool.json())).not.toContain('Elena');
    expect(names(herPool.json())).not.toContain('Alex');
    const send = await app.inject({
      method: 'POST',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(man.token),
      payload: { body: 'still here' },
    });
    expect(send.statusCode).toBe(403);
    expect(send.json()).toMatchObject({ code: 'chat_not_allowed' });
    const hers = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(woman.token),
    });
    expect(hers.statusCode).toBe(403);
    await app.close();
  });

  it('persists a Report with a reason and leaves the subject in the Pool', async () => {
    const app = await build();
    const man = await resident(app, 'man', 'women', 'Alex');
    const woman = await resident(app, 'woman', 'men', 'Elena');
    const filed = await app.inject({
      method: 'POST',
      url: '/v1/reports',
      headers: auth(man.token),
      payload: { profileId: woman.profileId, reason: 'harassment' },
    });
    expect(filed.statusCode).toBe(200);
    expect(filed.json()).toMatchObject({ reason: 'harassment' });
    expect((filed.json() as { reportId: string }).reportId).toBeTruthy();
    const pool = await app.inject({ method: 'GET', url: '/v1/pool', headers: auth(man.token) });
    expect(names(pool.json())).toContain('Elena');
    await app.close();
  });
});

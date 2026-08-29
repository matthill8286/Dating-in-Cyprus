import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { MemoryAccountStore } from '../account/store';
import { MemoryProfileStore } from '../profile/store';
import { MemoryLoopStore } from './store';

const NOW = new Date('2026-08-28T12:00:00.000Z');
let mobiles = 2000000;

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
  const { token, accountId } = join.json() as { token: string; accountId: string };
  const photoId = await uploadPhoto(app, token);
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
  const { profileId } = saved.json() as { profileId: string };
  return { token, accountId, profileId };
}

async function uploadPhoto(app: Awaited<ReturnType<typeof build>>, token: string) {
  const uploaded = await app.inject({
    method: 'POST',
    url: '/v1/profiles/me/photos',
    headers: { authorization: `Bearer ${token}` },
    payload: {
      contentType: 'image/jpeg',
      data: Buffer.from('portrait').toString('base64'),
    },
  });
  return (uploaded.json() as { photoId: string }).photoId;
}

function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

describe('Interest and Match', () => {
  it('keeps one-way Interest private until it is mutual', async () => {
    const app = await build();
    const man = await resident(app, 'man', 'women', 'Alex');
    const woman = await resident(app, 'woman', 'men', 'Elena');
    const first = await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(man.token),
      payload: { profileId: woman.profileId },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toEqual({ matched: false });
    const herMatches = await app.inject({
      method: 'GET',
      url: '/v1/matches',
      headers: auth(woman.token),
    });
    expect(herMatches.json()).toEqual({ matches: [] });
    const second = await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(woman.token),
      payload: { profileId: man.profileId },
    });
    expect(second.json()).toMatchObject({ matched: true });
    const hisMatches = await app.inject({
      method: 'GET',
      url: '/v1/matches',
      headers: auth(man.token),
    });
    const listed = hisMatches.json() as { matches: Array<{ profile: { firstName: string } }> };
    expect(listed.matches).toHaveLength(1);
    expect(listed.matches[0]?.profile.firstName).toBe('Elena');
    expect(listed.matches[0]).toMatchObject({ lastMessage: null });
    await app.close();
  });

  it('refuses Interest in someone who is not in discovery', async () => {
    const app = await build();
    const man = await resident(app, 'man', 'women', 'Alex');
    const otherMan = await resident(app, 'man', 'women', 'Niko');
    const refused = await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(man.token),
      payload: { profileId: otherMan.profileId },
    });
    expect(refused.statusCode).toBe(403);
    expect(refused.json()).toMatchObject({ code: 'interest_not_allowed' });
    const self = await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(man.token),
      payload: { profileId: man.profileId },
    });
    expect(self.statusCode).toBe(403);
    await app.close();
  });

  it('refuses Interest in a Profile with no photos', async () => {
    const app = await build();
    const man = await resident(app, 'man', 'women', 'Alex');
    const join = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: {
        email: `${randomUUID()}@example.com`,
        password: 'password1',
        dateOfBirth: '2005-08-28',
        launchLanguage: 'en',
        gender: 'woman',
        seeking: 'men',
        specialCategoryConsent: true,
        mobile: nextMobile(),
        primaryHomeAttestation: true,
        presence: { latitude: 34.685, longitude: 33.038 },
      },
    });
    const token = (join.json() as { token: string }).token;
    const saved = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: auth(token),
      payload: {
        firstName: 'Elena',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Lives in Limassol.',
      },
    });
    const refused = await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(man.token),
      payload: { profileId: (saved.json() as { profileId: string }).profileId },
    });
    expect(refused.statusCode).toBe(403);
    await app.close();
  });
});

describe('Interest idempotency', () => {
  it('treats duplicate Interest as idempotent', async () => {
    const app = await build();
    const man = await resident(app, 'man', 'women', 'Alex');
    const woman = await resident(app, 'woman', 'men', 'Elena');
    const payload = { profileId: woman.profileId };
    const first = await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(man.token),
      payload,
    });
    const again = await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(man.token),
      payload,
    });
    expect(first.json()).toEqual({ matched: false });
    expect(again.json()).toEqual({ matched: false });
    await app.close();
  });

  it('does not pass someone you already expressed Interest in', async () => {
    const app = await build();
    const man = await resident(app, 'man', 'women', 'Alex');
    const woman = await resident(app, 'woman', 'men', 'Elena');
    await app.inject({
      method: 'POST',
      url: '/v1/interests',
      headers: auth(man.token),
      payload: { profileId: woman.profileId },
    });
    const passed = await app.inject({
      method: 'POST',
      url: '/v1/passes',
      headers: auth(man.token),
      payload: { profileId: woman.profileId },
    });
    expect(passed.json()).toEqual({ ok: true });
    const listed = await app.inject({
      method: 'GET',
      url: '/v1/matches',
      headers: auth(woman.token),
    });
    expect(listed.json()).toEqual({ matches: [] });
    await app.close();
  });
});

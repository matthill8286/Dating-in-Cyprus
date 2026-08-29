import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { createSessionToken } from '../auth/sessionToken';
import { loadConfig } from '../config';
import { hashPassword } from '../account/password';
import { MemoryAccountStore } from '../account/store';
import { applySeed, womenSeekingMen } from '../dev/seedPeople';
import { MemoryProfileStore } from '../profile/store';

const NOW = new Date('2026-08-28T12:00:00.000Z');

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

const residentJoin = {
  email: 'resident@example.com',
  password: 'password1',
  dateOfBirth: '2005-08-28',
  launchLanguage: 'en' as const,
  gender: 'man' as const,
  seeking: 'women' as const,
  specialCategoryConsent: true as const,
  mobile: '+35799123456',
  primaryHomeAttestation: true as const,
  presence: { latitude: 34.685, longitude: 33.038 },
};

describe('Pool', () => {
  it('lets a Resident who passed the gate use the Pool', async () => {
    const app = await buildApp({
      config: testConfig(),
      accounts: new MemoryAccountStore(),
      now: () => NOW,
    });
    const join = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: residentJoin,
    });
    const { token } = join.json() as { token: string };
    const pool = await app.inject({
      method: 'GET',
      url: '/v1/pool',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(pool.statusCode).toBe(200);
    expect(pool.json()).toEqual({ admitted: true, profiles: [] });
    await app.close();
  });
});

describe('Pool photos', () => {
  it('shows women with photos to a man seeking women', async () => {
    const accounts = new MemoryAccountStore();
    const profiles = new MemoryProfileStore();
    await applySeed(accounts, profiles, () => 'seed:hash');
    const app = await buildApp({
      config: testConfig(),
      accounts,
      profiles,
      now: () => NOW,
    });
    const join = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: { ...residentJoin, email: 'viewer@example.com', mobile: '+35799888888' },
    });
    const { token } = join.json() as { token: string };
    const pool = await app.inject({
      method: 'GET',
      url: '/v1/pool',
      headers: { authorization: `Bearer ${token}` },
    });
    const body = pool.json() as {
      profiles: Array<{ firstName: string; photos: Array<{ url: string }> }>;
    };
    expect(pool.statusCode).toBe(200);
    expect(body.profiles).toHaveLength(womenSeekingMen().length);
    expect(body.profiles.every((item) => item.photos[0]?.url.startsWith('https://'))).toBe(true);
    await app.close();
  });
});

describe('Pool visitors', () => {
  it('refuses a Visitor session on the Pool', async () => {
    const config = testConfig();
    const accounts = new MemoryAccountStore();
    const visitor = await accounts.create({
      email: 'visitor@example.com',
      passwordHash: hashPassword('password1'),
      dateOfBirth: '2005-08-28',
      launchLanguage: 'en',
      gender: 'man',
      seeking: 'women',
      mobile: '+447700900123',
      residentAdmitted: false,
    });
    const app = await buildApp({ config, accounts, now: () => NOW });
    const token = createSessionToken(config.SESSION_SECRET, visitor.id);
    const pool = await app.inject({
      method: 'GET',
      url: '/v1/pool',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(pool.statusCode).toBe(403);
    expect(pool.json()).toMatchObject({ code: 'visitor_refused' });
    await app.close();
  });
});

describe('Pool after a decision', () => {
  it('hides a Profile after Pass', async () => {
    const app = await buildApp({
      config: testConfig(),
      accounts: new MemoryAccountStore(),
      profiles: new MemoryProfileStore(),
      now: () => NOW,
    });
    const viewer = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: { ...residentJoin, email: 'swiper@example.com', mobile: '+35799777701' },
    });
    const other = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: {
        ...residentJoin,
        email: 'card@example.com',
        mobile: '+35799777702',
        gender: 'woman',
        seeking: 'men',
      },
    });
    const viewerToken = (viewer.json() as { token: string }).token;
    const otherToken = (other.json() as { token: string }).token;
    const saved = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${otherToken}` },
      payload: {
        firstName: 'Elena',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Lives in Limassol.',
      },
    });
    const { profileId } = saved.json() as { profileId: string };
    await app.inject({
      method: 'POST',
      url: '/v1/passes',
      headers: { authorization: `Bearer ${viewerToken}` },
      payload: { profileId },
    });
    const after = await app.inject({
      method: 'GET',
      url: '/v1/pool',
      headers: { authorization: `Bearer ${viewerToken}` },
    });
    expect((after.json() as { profiles: unknown[] }).profiles).toEqual([]);
    await app.close();
  });
});

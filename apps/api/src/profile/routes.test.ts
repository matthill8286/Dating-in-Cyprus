import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { createSessionToken } from '../auth/sessionToken';
import { loadConfig } from '../config';
import { hashPassword } from '../account/password';
import { MemoryAccountStore } from '../account/store';
import { hasDatingIntentLabel } from './model';
import { MemoryProfileStore } from './store';

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

function adultJoin(email = `${randomUUID()}@example.com`) {
  return {
    email,
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
}

const leanProfile = {
  firstName: 'Ada',
  city: 'Limassol',
  languagesSpoken: ['en', 'uk'],
  bio: 'Lives in Limassol.',
};

async function build() {
  return buildApp({
    config: testConfig(),
    accounts: new MemoryAccountStore(),
    profiles: new MemoryProfileStore(),
    now: () => NOW,
  });
}

async function joinResident(app: Awaited<ReturnType<typeof build>>) {
  const join = await app.inject({
    method: 'POST',
    url: '/v1/accounts',
    payload: adultJoin(),
  });
  return join.json() as { accountId: string; token: string };
}

describe('lean Profile', () => {
  it('lets a Resident publish a lean Profile with age from date of birth', async () => {
    const app = await build();
    const { token, accountId } = await joinResident(app);
    const created = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${token}` },
      payload: leanProfile,
    });
    expect(created.statusCode).toBe(201);
    const body = created.json() as { accountId: string; age: number; firstName: string };
    expect(body.accountId).toBe(accountId);
    expect(body.firstName).toBe('Ada');
    expect(body.age).toBe(21);
    expect(hasDatingIntentLabel(body)).toBe(false);
    await app.close();
  });

  it('refuses a missing first name', async () => {
    const app = await build();
    const { token } = await joinResident(app);
    const created = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...leanProfile, firstName: '' },
    });
    expect(created.statusCode).toBe(400);
    await app.close();
  });

  it('refuses a city outside the Operating area', async () => {
    const app = await build();
    const { token } = await joinResident(app);
    const created = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...leanProfile, city: 'Kyrenia' },
    });
    expect(created.statusCode).toBe(400);
    await app.close();
  });
});

describe('Profile access', () => {
  it('refuses an unauthenticated Profile write', async () => {
    const app = await build();
    const created = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      payload: leanProfile,
    });
    expect(created.statusCode).toBe(401);
    await app.close();
  });

  it('refuses a Visitor Profile write', async () => {
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
    const app = await buildApp({
      config,
      accounts,
      profiles: new MemoryProfileStore(),
      now: () => NOW,
    });
    const token = createSessionToken(config.SESSION_SECRET, visitor.id);
    const created = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${token}` },
      payload: leanProfile,
    });
    expect(created.statusCode).toBe(403);
    expect(created.json()).toMatchObject({ code: 'visitor_refused' });
    await app.close();
  });

  it('lets a Resident read another Resident Profile', async () => {
    const app = await build();
    const owner = await joinResident(app);
    const created = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${owner.token}` },
      payload: leanProfile,
    });
    const { profileId } = created.json() as { profileId: string };
    const reader = await joinResident(app);
    const viewed = await app.inject({
      method: 'GET',
      url: `/v1/profiles/${profileId}`,
      headers: { authorization: `Bearer ${reader.token}` },
    });
    expect(viewed.statusCode).toBe(200);
    expect(viewed.json()).toMatchObject({ firstName: 'Ada', city: 'Limassol' });
    const own = await app.inject({
      method: 'GET',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${owner.token}` },
    });
    expect(own.statusCode).toBe(200);
    expect(own.json()).toMatchObject({ profileId, firstName: 'Ada' });
    await app.close();
  });
});

describe('Profile photos and R-16', () => {
  it('stores a photo in the EU photo store', async () => {
    const app = await build();
    const { token } = await joinResident(app);
    const uploaded = await app.inject({
      method: 'POST',
      url: '/v1/profiles/me/photos',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        contentType: 'image/jpeg',
        data: Buffer.from('fake-photo').toString('base64'),
      },
    });
    expect(uploaded.statusCode).toBe(201);
    const photo = uploaded.json() as { photoId: string; url: string };
    expect(photo.url).toContain('westeurope');
    const saved = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${token}` },
      payload: { ...leanProfile, photoIds: [photo.photoId] },
    });
    expect(saved.statusCode).toBe(201);
    expect(saved.json()).toMatchObject({
      photos: [{ photoId: photo.photoId, url: photo.url }],
    });
    await app.close();
  });

  it('keeps dating-intent labels out of OpenAPI and Profile responses', async () => {
    const app = await build();
    await app.ready();
    const spec = app.swagger();
    expect(hasDatingIntentLabel(spec)).toBe(false);
    const { token } = await joinResident(app);
    const created = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: { authorization: `Bearer ${token}` },
      payload: leanProfile,
    });
    expect(hasDatingIntentLabel(created.json())).toBe(false);
    await app.close();
  });
});

import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { MemoryAccountStore } from '../account/store';
import { MemoryProfileStore } from './store';
import { MemoryLoopStore } from '../match/store';
import { stubVendor } from './vendor';

const NOW = new Date('2026-08-28T12:00:00.000Z');
let mobiles = 5000000;

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

async function build(vendor = stubVendor('passed')) {
  return buildApp({
    config: testConfig(),
    accounts: new MemoryAccountStore(),
    profiles: new MemoryProfileStore(),
    loop: new MemoryLoopStore(),
    photoVendor: vendor,
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

describe('Photo verification in the Pool', () => {
  it('returns an unverified Profile in discovery with the mark', async () => {
    const app = await build();
    const viewer = await resident(app, 'man', 'women', 'Alex');
    const other = await resident(app, 'woman', 'men', 'Elena');
    const pool = await app.inject({ method: 'GET', url: '/v1/pool', headers: auth(viewer.token) });
    const found = (pool.json() as { profiles: Array<{ profileId: string; photoVerification: string }> })
      .profiles.find((item) => item.profileId === other.profileId);
    expect(found?.photoVerification).toBe('unverified');
    const own = await app.inject({ method: 'GET', url: '/v1/profiles/me', headers: auth(other.token) });
    expect(own.json()).toMatchObject({ photoVerification: 'unverified' });
    await app.close();
  });

  it('marks the Profile verified after a pass and keeps them in the Pool', async () => {
    const app = await build(stubVendor('passed'));
    const viewer = await resident(app, 'man', 'women', 'Alex');
    const other = await resident(app, 'woman', 'men', 'Elena');
    const started = Date.now();
    const start = await app.inject({
      method: 'POST',
      url: '/v1/photo-verifications',
      headers: auth(other.token),
      payload: {},
    });
    expect(Date.now() - started).toBeLessThan(15_000);
    expect(start.statusCode).toBe(200);
    expect(start.json()).toMatchObject({ status: 'passed', photoVerification: 'verified' });
    const pool = await app.inject({ method: 'GET', url: '/v1/pool', headers: auth(viewer.token) });
    const found = (pool.json() as { profiles: Array<{ profileId: string; photoVerification: string }> })
      .profiles.find((item) => item.profileId === other.profileId);
    expect(found?.photoVerification).toBe('verified');
    await app.close();
  });
});

describe('Photo verification fail, skip, and vendor', () => {
  it('leaves a fail or skip unverified and still in the Pool', async () => {
    const app = await build(stubVendor('failed'));
    const viewer = await resident(app, 'man', 'women', 'Alex');
    const failed = await resident(app, 'woman', 'men', 'Elena');
    const fail = await app.inject({
      method: 'POST',
      url: '/v1/photo-verifications',
      headers: auth(failed.token),
      payload: {},
    });
    expect(fail.json()).toMatchObject({ status: 'failed', photoVerification: 'unverified' });
    const skipped = await resident(app, 'woman', 'men', 'Irina');
    const skip = await app.inject({
      method: 'POST',
      url: '/v1/photo-verifications',
      headers: auth(skipped.token),
      payload: { skip: true },
    });
    expect(skip.json()).toMatchObject({ status: 'skipped', photoVerification: 'unverified' });
    const pool = await app.inject({ method: 'GET', url: '/v1/pool', headers: auth(viewer.token) });
    const names = (pool.json() as { profiles: Array<{ firstName: string; photoVerification: string }> })
      .profiles;
    expect(names.find((item) => item.firstName === 'Elena')?.photoVerification).toBe('unverified');
    expect(names.find((item) => item.firstName === 'Irina')?.photoVerification).toBe('unverified');
    await app.close();
  });

  it('ignores a client-supplied verified flag and hides another Account\'s check', async () => {
    const app = await build();
    const owner = await resident(app, 'woman', 'men', 'Elena');
    const other = await resident(app, 'man', 'women', 'Alex');
    const patched = await app.inject({
      method: 'PATCH',
      url: '/v1/profiles/me',
      headers: auth(owner.token),
      payload: {
        firstName: 'Elena',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Lives in Limassol.',
        photoVerification: 'verified',
      },
    });
    expect(patched.json()).toMatchObject({ photoVerification: 'unverified' });
    const start = await app.inject({
      method: 'POST',
      url: '/v1/photo-verifications',
      headers: auth(owner.token),
      payload: {},
    });
    const { photoVerificationId } = start.json() as { photoVerificationId: string };
    const stolen = await app.inject({
      method: 'GET',
      url: `/v1/photo-verifications/${photoVerificationId}`,
      headers: auth(other.token),
    });
    expect(stolen.statusCode).toBe(404);
    const missing = await app.inject({
      method: 'GET',
      url: `/v1/photo-verifications/${randomUUID()}`,
      headers: auth(owner.token),
    });
    expect(missing.statusCode).toBe(404);
    await app.close();
  });

  it('returns 502 when the Photo verification vendor is down', async () => {
    const app = await build(stubVendor('unavailable'));
    const owner = await resident(app, 'woman', 'men', 'Elena');
    const start = await app.inject({
      method: 'POST',
      url: '/v1/photo-verifications',
      headers: auth(owner.token),
      payload: {},
    });
    expect(start.statusCode).toBe(502);
    expect(start.json()).toMatchObject({ code: 'photo_verification_unavailable' });
    await app.close();
  });
});

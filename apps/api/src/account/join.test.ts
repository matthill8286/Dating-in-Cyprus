import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { MemoryAccountStore } from './store';

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
  };
}

async function build() {
  return buildApp({
    config: testConfig(),
    accounts: new MemoryAccountStore(),
    now: () => NOW,
  });
}

describe('Account join', () => {
  it('creates an Account at 21 and the session authorises /v1/session', async () => {
    const app = await build();
    const join = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: adultJoin(),
    });
    expect(join.statusCode).toBe(201);
    const body = join.json() as { accountId: string; token: string };
    expect(body.accountId).toBeTruthy();
    const session = await app.inject({
      method: 'GET',
      url: '/v1/session',
      headers: { authorization: `Bearer ${body.token}` },
    });
    expect(session.statusCode).toBe(200);
    expect(session.json()).toEqual({ accountId: body.accountId });
    await app.close();
  });

  it('refuses join at 20 as age_ineligible', async () => {
    const app = await build();
    const join = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: { ...adultJoin(), dateOfBirth: '2005-08-29' },
    });
    expect(join.statusCode).toBe(403);
    expect(join.json()).toMatchObject({ code: 'age_ineligible' });
    await app.close();
  });

  it('refuses a second Account with the same email', async () => {
    const app = await build();
    const email = `${randomUUID()}@example.com`;
    const first = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: adultJoin(email),
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: adultJoin(email),
    });
    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({ code: 'conflict' });
    await app.close();
  });

  it('refuses join without special-category consent', async () => {
    const app = await build();
    const join = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: { ...adultJoin(), specialCategoryConsent: false },
    });
    expect(join.statusCode).toBe(400);
    await app.close();
  });
});

describe('Account sign-in', () => {
  it('reissues a session on sign-in', async () => {
    const app = await build();
    const email = `${randomUUID()}@example.com`;
    const created = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: adultJoin(email),
    });
    const first = created.json() as { token: string; accountId: string };
    const signIn = await app.inject({
      method: 'POST',
      url: '/v1/sessions',
      payload: { email, password: 'password1' },
    });
    expect(signIn.statusCode).toBe(200);
    const second = signIn.json() as { token: string; accountId: string };
    expect(second.accountId).toBe(first.accountId);
    expect(second.token).not.toBe(first.token);
    const session = await app.inject({
      method: 'GET',
      url: '/v1/session',
      headers: { authorization: `Bearer ${second.token}` },
    });
    expect(session.statusCode).toBe(200);
    await app.close();
  });

  it('refuses sign-in with the wrong password', async () => {
    const app = await build();
    const email = `${randomUUID()}@example.com`;
    await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: adultJoin(email),
    });
    const signIn = await app.inject({
      method: 'POST',
      url: '/v1/sessions',
      payload: { email, password: 'wrongpass' },
    });
    expect(signIn.statusCode).toBe(401);
    expect(signIn.json()).toMatchObject({ code: 'unauthenticated' });
    await app.close();
  });
});

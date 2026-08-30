import { describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { createSessionToken } from './auth/sessionToken';
import { loadConfig } from './config';

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

describe('app', () => {
  it('returns health ok without a session', async () => {
    const app = await buildApp({ config: testConfig() });
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });

  it('publishes health and session paths in OpenAPI', async () => {
    const app = await buildApp({ config: testConfig() });
    await app.ready();
    const spec = app.swagger();
    expect(spec.paths?.['/health']).toBeDefined();
    expect(spec.paths?.['/v1/session']).toBeDefined();
    expect(spec.paths?.['/v1/accounts']).toBeDefined();
    expect(spec.paths?.['/v1/sessions']).toBeDefined();
    expect(spec.paths?.['/v1/pool']).toBeDefined();
    expect(spec.paths?.['/v1/profiles/me']).toBeDefined();
    expect(spec.paths?.['/v1/interests']).toBeDefined();
    expect(spec.paths?.['/v1/passes']).toBeDefined();
    expect(spec.paths?.['/v1/matches']).toBeDefined();
    expect(spec.paths?.['/v1/blocks']).toBeDefined();
    expect(spec.paths?.['/v1/reports']).toBeDefined();
    expect(spec.paths?.['/v1/photo-verifications']).toBeDefined();
    await app.close();
  });

  it('rejects session without a token', async () => {
    const app = await buildApp({ config: testConfig() });
    const res = await app.inject({ method: 'GET', url: '/v1/session' });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('rejects session with a bad token', async () => {
    const app = await buildApp({ config: testConfig() });
    const res = await app.inject({
      method: 'GET',
      url: '/v1/session',
      headers: { authorization: 'Bearer not-a-token' },
    });
    expect(res.statusCode).toBe(401);
    await app.close();
  });

  it('returns the Account id for a valid session', async () => {
    const config = testConfig();
    const app = await buildApp({ config });
    const token = createSessionToken(config.SESSION_SECRET, 'acc-1');
    const res = await app.inject({
      method: 'GET',
      url: '/v1/session',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ accountId: 'acc-1' });
    await app.close();
  });
});

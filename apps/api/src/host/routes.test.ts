import { describe, expect, it } from 'vitest';
import { hashPassword } from '../account/password';
import { MemoryAccountStore } from '../account/store';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { applySeed } from '../dev/seedPeople';
import { MemoryLoopStore } from '../match/store';
import { MemoryProfileStore } from '../profile/store';
import { MemoryIntroStore } from './store';

const NOW = new Date('2026-08-30T12:00:00.000Z');

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

async function seededApp() {
  const accounts = new MemoryAccountStore();
  const profiles = new MemoryProfileStore();
  const loop = new MemoryLoopStore();
  await applySeed(accounts, profiles, hashPassword, loop);
  return buildApp({
    config: testConfig(),
    accounts,
    profiles,
    loop,
    intros: new MemoryIntroStore(),
    now: () => NOW,
  });
}

async function signInAlex(app: Awaited<ReturnType<typeof seededApp>>) {
  const session = await app.inject({
    method: 'POST',
    url: '/v1/sessions',
    payload: { email: 'seed.alex@here.local', password: 'password1' },
  });
  return (session.json() as { token: string }).token;
}

function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

type IntroJson = {
  introduction: {
    introductionId: string;
    profileId: string;
    firstName: string;
    city: string;
    reason: string;
    meetFraming: string;
    portraitUrl: string;
    expiresAt: string;
  } | null;
};

async function readIntro(app: Awaited<ReturnType<typeof seededApp>>, token: string) {
  const res = await app.inject({
    method: 'GET',
    url: '/v1/introductions',
    headers: auth(token),
  });
  return { status: res.statusCode, body: res.json() as IntroJson };
}

describe('Introduction proposal', () => {
  it('proposes one Pool person with a written reason, not an invented biography', async () => {
    const app = await seededApp();
    const token = await signInAlex(app);
    const first = await readIntro(app, token);
    const again = await readIntro(app, token);
    expect(first.status).toBe(200);
    const intro = first.body.introduction;
    expect(intro?.city).toBe('Limassol');
    expect(intro?.reason).toMatch(/Limassol/);
    expect(intro?.meetFraming).toMatch(/sea path/);
    expect(intro?.expiresAt).toBe('2026-08-31T12:00:00.000Z');
    expect(intro?.portraitUrl).toMatch(/^https?:\/\//);
    expect(again.body.introduction?.introductionId).toBe(intro?.introductionId);
    await app.close();
  });
});

describe('Introduction yes and pass', () => {
  it('records Yes as Interest and Match when the other Resident already said yes', async () => {
    const app = await seededApp();
    const token = await signInAlex(app);
    const { body } = await readIntro(app, token);
    const yes = await app.inject({
      method: 'POST',
      url: `/v1/introductions/${body.introduction?.introductionId}/yes`,
      headers: auth(token),
    });
    expect(yes.statusCode).toBe(200);
    expect(yes.json()).toMatchObject({ matched: true });
    const next = await readIntro(app, token);
    expect(next.body.introduction?.profileId).not.toBe(body.introduction?.profileId);
    await app.close();
  });

  it('records Not this as a Pass and will not propose that person again', async () => {
    const app = await seededApp();
    const token = await signInAlex(app);
    const { body } = await readIntro(app, token);
    const pass = await app.inject({
      method: 'POST',
      url: `/v1/introductions/${body.introduction?.introductionId}/pass`,
      headers: auth(token),
    });
    expect(pass.statusCode).toBe(200);
    expect(pass.json()).toEqual({ ok: true });
    const next = await readIntro(app, token);
    expect(next.body.introduction?.profileId).not.toBe(body.introduction?.profileId);
    const ghost = await app.inject({
      method: 'POST',
      url: `/v1/introductions/${body.introduction?.introductionId}/pass`,
      headers: auth(token),
    });
    expect(ghost.statusCode).toBe(404);
    await app.close();
  });
});

describe('Introduction gate', () => {
  it('refuses a missing session and a Resident without a Profile', async () => {
    const app = await buildApp({ config: testConfig(), now: () => NOW });
    const anon = await app.inject({ method: 'GET', url: '/v1/introductions' });
    expect(anon.statusCode).toBe(401);
    const joined = await app.inject({
      method: 'POST',
      url: '/v1/accounts',
      payload: {
        email: 'noprofile@example.com',
        password: 'password1',
        dateOfBirth: '1991-04-04',
        launchLanguage: 'en',
        gender: 'man',
        seeking: 'women',
        specialCategoryConsent: true,
        mobile: '+35799111000',
        primaryHomeAttestation: true,
        presence: { latitude: 34.685, longitude: 33.038 },
      },
    });
    const { token } = joined.json() as { token: string };
    const bare = await app.inject({
      method: 'GET',
      url: '/v1/introductions',
      headers: auth(token),
    });
    expect(bare.statusCode).toBe(403);
    expect(bare.json()).toMatchObject({ code: 'profile_required' });
    await app.close();
  });
});

describe('Introduction expiry', () => {
  it('returns 410 when Yes is sent after the Introduction expires', async () => {
    const clock = { now: NOW };
    const accounts = new MemoryAccountStore();
    const profiles = new MemoryProfileStore();
    const loop = new MemoryLoopStore();
    await applySeed(accounts, profiles, hashPassword, loop);
    const app = await buildApp({
      config: testConfig(),
      accounts,
      profiles,
      loop,
      intros: new MemoryIntroStore(),
      now: () => clock.now,
    });
    const token = await signInAlex(app);
    const { body } = await readIntro(app, token);
    clock.now = new Date('2026-08-31T12:00:00.000Z');
    const gone = await app.inject({
      method: 'POST',
      url: `/v1/introductions/${body.introduction?.introductionId}/yes`,
      headers: auth(token),
    });
    expect(gone.statusCode).toBe(410);
    expect(gone.json()).toMatchObject({ code: 'introduction_expired' });
    await app.close();
  });
});

describe('Introduction from what the Resident asked Here', () => {
  it('re-picks from the Pool using the written want, without a Pass', async () => {
    const app = await seededApp();
    const token = await signInAlex(app);
    const first = await readIntro(app, token);
    const asked = await app.inject({
      method: 'POST',
      url: '/v1/introductions',
      headers: auth(token),
      payload: { want: 'Paphos harbour' },
    });
    expect(asked.statusCode).toBe(200);
    const intro = (asked.json() as IntroJson).introduction;
    expect(intro?.city).toBe('Paphos');
    expect(intro?.reason).toMatch(/harbour|Paphos/i);
    expect(intro?.introductionId).not.toBe(first.body.introduction?.introductionId);
    expect(intro?.reason).not.toMatch(/engineer|lawyer|doctor/i);
    await app.close();
  });

  it('proposes a Russian speaker when the Resident asked for Russian', async () => {
    const app = await seededApp();
    const token = await signInAlex(app);
    const asked = await app.inject({
      method: 'POST',
      url: '/v1/introductions',
      headers: auth(token),
      payload: { want: '25, russian, fun' },
    });
    expect(asked.statusCode).toBe(200);
    const intro = (asked.json() as IntroJson).introduction;
    expect(intro?.reason).toMatch(/Russian/i);
    expect(intro?.reason).not.toMatch(/Ukrainian/i);
    expect(intro?.reason).not.toMatch(/engineer|lawyer|doctor/i);
    await app.close();
  });

  it('keeps the last want after Not this', async () => {
    const app = await seededApp();
    const token = await signInAlex(app);
    const asked = await app.inject({
      method: 'POST',
      url: '/v1/introductions',
      headers: auth(token),
      payload: { want: 'Russian that speaks English' },
    });
    const first = (asked.json() as IntroJson).introduction;
    await app.inject({
      method: 'POST',
      url: `/v1/introductions/${first?.introductionId}/pass`,
      headers: auth(token),
    });
    const next = await readIntro(app, token);
    expect(next.body.introduction?.profileId).not.toBe(first?.profileId);
    expect(next.body.introduction?.reason).toMatch(/Russian/i);
    await app.close();
  });
});

describe('Introduction from an EU model', () => {
  it('uses a listed profileId from the model and still writes a grounded reason', async () => {
    const accounts = new MemoryAccountStore();
    const profiles = new MemoryProfileStore();
    const loop = new MemoryLoopStore();
    await applySeed(accounts, profiles, hashPassword, loop);
    const app = await buildApp({
      config: loadConfig({
        CORS_ORIGINS: 'http://localhost:8081',
        SESSION_SECRET: 's'.repeat(32),
        NODE_ENV: 'test',
        DATA_REGION: 'westeurope',
        PHOTO_STORE_REGION: 'westeurope',
        DATABASE_URL: 'postgres://dating:dating@localhost:5432/dating',
        HOST_MODEL_URL: 'https://example.test/openai/chat/completions',
      }),
      accounts,
      profiles,
      loop,
      intros: new MemoryIntroStore(),
      now: () => NOW,
      hostFetch: async (_url, init) => modelPick(init, 'Paphos'),
    });
    const token = await signInAlex(app);
    const { status, body } = await readIntro(app, token);
    expect(status).toBe(200);
    expect(body.introduction?.city).toBe('Paphos');
    expect(body.introduction?.reason).toMatch(/Paphos|harbour/i);
    expect(body.introduction?.reason).not.toMatch(/engineer|lawyer|doctor/i);
    await app.close();
  });
});

function modelPick(init: RequestInit | undefined, city: string): Response {
  const posted = JSON.parse(String(init?.body)) as { messages: Array<{ content: string }> };
  const people = (
    JSON.parse(posted.messages[1]?.content ?? '{}') as {
      people: Array<{ profileId: string; city: string }>;
    }
  ).people;
  const person = people.find((entry) => entry.city === city) ?? people[0];
  return {
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ profileId: person?.profileId }) } }],
    }),
  } as Response;
}

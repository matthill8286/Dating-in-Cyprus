import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildApp } from '../app';
import { loadConfig } from '../config';
import { MemoryAccountStore } from '../account/store';
import { MemoryProfileStore } from '../profile/store';
import { MemoryLoopStore } from './store';

const NOW = new Date('2026-08-28T12:00:00.000Z');
let mobiles = 3000000;

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
  const { matchId } = matched.json() as { matchId: string };
  return { man, woman, matchId };
}

describe('Chat after Match', () => {
  it('lets the matched pair send and list messages', async () => {
    const app = await build();
    const { man, woman, matchId } = await openMatch(app);
    const detail = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}`,
      headers: auth(man.token),
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      matchId,
      profile: { firstName: 'Elena' },
      lastMessage: null,
    });
    const sent = await app.inject({
      method: 'POST',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(man.token),
      payload: { body: 'Hello from Limassol' },
    });
    expect(sent.statusCode).toBe(201);
    expect(sent.json()).toMatchObject({ fromMe: true, body: 'Hello from Limassol' });
    const hers = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(woman.token),
    });
    const listed = hers.json() as { messages: Array<{ fromMe: boolean; body: string }> };
    expect(listed.messages).toHaveLength(1);
    expect(listed.messages[0]).toMatchObject({ fromMe: false, body: 'Hello from Limassol' });
    const preview = await app.inject({
      method: 'GET',
      url: '/v1/matches',
      headers: auth(woman.token),
    });
    expect(preview.json()).toMatchObject({
      matches: [{ lastMessage: { body: 'Hello from Limassol', fromMe: false } }],
    });
    await app.close();
  });

  it('returns a newest-first window of a long thread', async () => {
    const app = await build();
    const { man, woman, matchId } = await openMatch(app);
    for (const body of ['one', 'two', 'three', 'four', 'five']) {
      await app.inject({
        method: 'POST',
        url: `/v1/matches/${matchId}/messages`,
        headers: auth(man.token),
        payload: { body },
      });
    }
    const recent = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages?limit=2`,
      headers: auth(woman.token),
    });
    const page = (recent.json() as { messages: Array<{ body: string; sentAt: string }> }).messages;
    expect(page.map((message) => message.body)).toEqual(['four', 'five']);
    const older = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages?limit=2&before=${encodeURIComponent(page[0]!.sentAt)}`,
      headers: auth(woman.token),
    });
    const bodies = (older.json() as { messages: Array<{ body: string }> }).messages.map(
      (message) => message.body,
    );
    expect(bodies).not.toContain('four');
    expect(bodies).not.toContain('five');
    expect(bodies.length).toBeLessThanOrEqual(2);
    await app.close();
  });

  it('answers a poll for an unchanged thread with 304', async () => {
    const app = await build();
    const { man, woman, matchId } = await openMatch(app);
    await app.inject({
      method: 'POST',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(man.token),
      payload: { body: 'Hello' },
    });
    const first = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(woman.token),
    });
    expect(first.statusCode).toBe(200);
    expect(first.headers['cache-control']).toBe('private, max-age=0, must-revalidate');
    const tag = first.headers.etag as string;
    expect(tag).toBeTruthy();
    const unchanged = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages`,
      headers: { ...auth(woman.token), 'if-none-match': tag },
    });
    expect(unchanged.statusCode).toBe(304);
    await app.inject({
      method: 'POST',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(woman.token),
      payload: { body: 'And back' },
    });
    const changed = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages`,
      headers: { ...auth(woman.token), 'if-none-match': tag },
    });
    expect(changed.statusCode).toBe(200);
    await app.close();
  });

  it('builds the inbox without reading each thread in turn', async () => {
    const loop = new MemoryLoopStore();
    const app = await buildApp({
      config: testConfig(),
      accounts: new MemoryAccountStore(),
      profiles: new MemoryProfileStore(),
      loop,
      now: () => NOW,
    });
    const { man, woman, matchId } = await openMatch(app);
    await app.inject({
      method: 'POST',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(man.token),
      payload: { body: 'Hello' },
    });
    const perThread = vi.spyOn(loop, 'listMessages');
    const inbox = await app.inject({ method: 'GET', url: '/v1/matches', headers: auth(woman.token) });
    expect(inbox.json()).toMatchObject({ matches: [{ lastMessage: { body: 'Hello' } }] });
    expect(perThread).not.toHaveBeenCalled();
    await app.close();
  });

  it('refuses chat when there is no Match or the caller is an outsider', async () => {
    const app = await build();
    const { man, matchId } = await openMatch(app);
    const outsider = await resident(app, 'man', 'women', 'Niko');
    const missing = await app.inject({
      method: 'POST',
      url: `/v1/matches/${randomUUID()}/messages`,
      headers: auth(man.token),
      payload: { body: 'nope' },
    });
    expect(missing.statusCode).toBe(404);
    const peek = await app.inject({
      method: 'GET',
      url: `/v1/matches/${matchId}/messages`,
      headers: auth(outsider.token),
    });
    expect(peek.statusCode).toBe(404);
    const missingMatch = await app.inject({
      method: 'GET',
      url: `/v1/matches/${randomUUID()}`,
      headers: auth(man.token),
    });
    expect(missingMatch.statusCode).toBe(404);
    await app.close();
  });
});

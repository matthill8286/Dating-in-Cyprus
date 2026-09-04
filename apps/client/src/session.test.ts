import { describe, expect, it } from 'vitest';
import {
  asyncSessionStore,
  readSession,
  SESSION_KEY,
  sessionExpired,
  writeSession,
  type SessionStore,
} from './session';

function memoryStore(): SessionStore {
  const held = new Map<string, string>();
  return {
    getItem: (key) => held.get(key) ?? null,
    setItem: (key, value) => {
      held.set(key, value);
    },
    removeItem: (key) => {
      held.delete(key);
    },
  };
}

describe('session storage', () => {
  it('keeps and clears the token, and tolerates having no store at all', () => {
    const store = memoryStore();
    expect(readSession(store)).toBeNull();
    writeSession(store, 'sess-1');
    expect(store.getItem(SESSION_KEY)).toBe('sess-1');
    writeSession(store, null);
    expect(readSession(store)).toBeNull();
    expect(readSession(null)).toBeNull();
    expect(() => writeSession(null, 'sess-1')).not.toThrow();
  });

  it('treats 401 as an expired session', () => {
    expect(sessionExpired(401)).toBe(true);
    expect(sessionExpired(403)).toBe(false);
    expect(sessionExpired(undefined)).toBe(false);
  });
});

describe('asyncSessionStore', () => {
  it('prefers the secure store when the platform has one', async () => {
    let held: string | null = 'from-keychain';
    const secure = {
      read: async () => held,
      write: async (token: string | null) => {
        held = token;
      },
    };
    const store = asyncSessionStore(secure, memoryStore());
    expect(await store.read()).toBe('from-keychain');
    await store.write(null);
    expect(await store.read()).toBeNull();
  });

  it('falls back to the browser store on web', async () => {
    const browser = memoryStore();
    const store = asyncSessionStore(null, browser);
    await store.write('sess-2');
    expect(await store.read()).toBe('sess-2');
    expect(browser.getItem(SESSION_KEY)).toBe('sess-2');
  });

  it('reads null when there is no store anywhere', async () => {
    const store = asyncSessionStore(null, null);
    await store.write('sess-3');
    expect(await store.read()).toBeNull();
  });
});

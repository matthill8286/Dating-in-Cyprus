import { describe, expect, it } from 'vitest';
import { readSession, SESSION_KEY, sessionExpired, writeSession, type SessionStore } from './session';

function memoryStore(start: Record<string, string> = {}): SessionStore {
  const data = { ...start };
  return {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

describe('session persistence', () => {
  it('reads and writes the session token, and clears it on sign-out', () => {
    const store = memoryStore();
    expect(readSession(null)).toBeNull();
    expect(readSession(store)).toBeNull();
    writeSession(store, 'tok-1');
    expect(store.getItem(SESSION_KEY)).toBe('tok-1');
    expect(readSession(store)).toBe('tok-1');
    writeSession(store, null);
    expect(readSession(store)).toBeNull();
    writeSession(null, 'tok-2');
    expect(sessionExpired(401)).toBe(true);
    expect(sessionExpired(200)).toBe(false);
    expect(sessionExpired(undefined)).toBe(false);
  });
});

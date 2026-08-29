export const SESSION_KEY = 'here.sessionToken';

export type SessionStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function readSession(store: SessionStore | null | undefined): string | null {
  if (!store) return null;
  return store.getItem(SESSION_KEY);
}

export function writeSession(store: SessionStore | null | undefined, token: string | null): void {
  if (!store) return;
  if (token) store.setItem(SESSION_KEY, token);
  else store.removeItem(SESSION_KEY);
}

export function browserSessionStore(): SessionStore | null {
  try {
    const storage = globalThis.localStorage;
    if (!storage) return null;
    return storage;
  } catch {
    return null;
  }
}

export function sessionExpired(status: number | undefined): boolean {
  return status === 401;
}

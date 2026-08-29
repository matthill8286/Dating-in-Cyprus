import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '../profile';
import { browserSessionStore, readSession, writeSession } from '../session';

interface AppState {
  sessionToken: string | null;
  setSessionToken: (value: string | null) => void;
  profile: Profile | null;
  setProfile: (value: Profile | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const store = browserSessionStore();
  const [sessionToken, setToken] = useState<string | null>(() => readSession(store));
  const [profile, setProfile] = useState<Profile | null>(null);
  const setSessionToken = useCallback((value: string | null) => {
    writeSession(browserSessionStore(), value);
    setToken(value);
    if (!value) setProfile(null);
  }, []);
  const value = useMemo(
    () => ({ sessionToken, setSessionToken, profile, setProfile }),
    [sessionToken, setSessionToken, profile],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

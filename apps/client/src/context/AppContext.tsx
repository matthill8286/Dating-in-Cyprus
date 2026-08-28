import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '../profile';

interface AppState {
  sessionToken: string | null;
  setSessionToken: (value: string | null) => void;
  profile: Profile | null;
  setProfile: (value: Profile | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const value = useMemo(
    () => ({ sessionToken, setSessionToken, profile, setProfile }),
    [sessionToken, profile],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

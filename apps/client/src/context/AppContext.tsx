import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Profile } from '../profile';
import { secureSessionStore } from '../secureSession';
import { asyncSessionStore, browserSessionStore } from '../session';

interface AppState {
  sessionToken: string | null;
  setSessionToken: (value: string | null) => void;
  profile: Profile | null;
  setProfile: (value: Profile | null) => void;
  /** False until the stored token has been read back, so we do not flash the sign-in screen. */
  restored: boolean;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useRef(asyncSessionStore(secureSessionStore(), browserSessionStore()));
  const [sessionToken, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let live = true;
    void store.current.read().then((token) => {
      if (!live) return;
      if (token) setToken(token);
      setRestored(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const setSessionToken = useCallback((value: string | null) => {
    void store.current.write(value);
    setToken(value);
    if (!value) setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ sessionToken, setSessionToken, profile, setProfile, restored }),
    [sessionToken, setSessionToken, profile, restored],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

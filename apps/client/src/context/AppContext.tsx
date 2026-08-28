import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface AppState {
  sessionToken: string | null;
  setSessionToken: (value: string | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const value = useMemo(() => ({ sessionToken, setSessionToken }), [sessionToken]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

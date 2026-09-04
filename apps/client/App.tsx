import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient } from './src/api/queryClient';
import { cachePersistOptions } from './src/api/persist';
import { isUnauthorized } from './src/api/unwrap';
import { AppProvider, useApp } from './src/context/AppContext';
import { IntakeScreen } from './src/IntakeScreen';
import { NotifyScreen } from './src/NotifyScreen';
import { AuthStack } from './src/navigation/AuthStack';
import { MainTabs } from './src/navigation/MainTabs';
import { useMe } from './src/queries/feeds';
import { usePrefetchFeeds } from './src/queries/prefetch';
import { UnreachableScreen } from './src/UnreachableScreen';
import { HostLoadingScreen } from './src/ui/skeleton';
import { ensureWebFonts } from './src/theme';

ensureWebFonts();

const queryClient = createQueryClient();

function SignedInGate() {
  const { sessionToken, profile, setProfile, setSessionToken } = useApp();
  const [notify, setNotify] = useState(false);
  const me = useMe(sessionToken);

  usePrefetchFeeds(sessionToken);

  useEffect(() => {
    if (me.profile) setProfile(me.profile);
    else if (isUnauthorized(me.error)) setSessionToken(null);
  }, [me.profile, me.error, setProfile, setSessionToken]);

  if (profile) {
    if (notify) return <NotifyScreen onDone={() => setNotify(false)} />;
    return <MainTabs />;
  }
  if (!me.settled) return <HostLoadingScreen />;
  if (me.unreachable) return <UnreachableScreen onRetry={me.retry} />;
  if (me.needsProfile) return <IntakeScreen onSaved={() => setNotify(true)} />;
  return <HostLoadingScreen />;
}

function Root() {
  const { sessionToken, restored } = useApp();
  if (!restored) return <HostLoadingScreen />;
  return sessionToken ? <SignedInGate /> : <AuthStack />;
}

export default function App() {
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={cachePersistOptions}>
      <SafeAreaProvider>
        <AppProvider>
          <NavigationContainer>
            <Root />
          </NavigationContainer>
          <StatusBar style="dark" />
        </AppProvider>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

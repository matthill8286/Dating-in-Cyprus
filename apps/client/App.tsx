import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from './src/api/client';
import { AppProvider, useApp } from './src/context/AppContext';
import { JoinScreen } from './src/JoinScreen';
import { ProfileEditScreen } from './src/ProfileEditScreen';
import { ProfileViewScreen } from './src/ProfileViewScreen';
import type { Profile } from './src/profile';

function ProfileGate() {
  const { sessionToken, profile, setProfile } = useApp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionToken) return;
    void api
      .GET('/v1/profiles/me', { headers: { authorization: `Bearer ${sessionToken}` } })
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      })
      .finally(() => setReady(true));
  }, [sessionToken, setProfile]);

  if (!ready) return <Text>Loading Profile</Text>;
  if (!profile) return <ProfileEditScreen />;
  return <ProfileViewScreen />;
}

function Root() {
  const { sessionToken } = useApp();
  if (!sessionToken) return <JoinScreen />;
  return <ProfileGate />;
}

export default function App() {
  return (
    <AppProvider>
      <Root />
      <StatusBar style="auto" />
    </AppProvider>
  );
}

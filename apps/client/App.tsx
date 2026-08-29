import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { api } from './src/api/client';
import { AppProvider, useApp } from './src/context/AppContext';
import { JoinScreen } from './src/JoinScreen';
import { OnboardingScreen } from './src/OnboardingScreen';
import { MatchesScreen } from './src/MatchesScreen';
import { PoolScreen } from './src/PoolScreen';
import { ProfileEditScreen } from './src/ProfileEditScreen';
import { ProfileViewScreen } from './src/ProfileViewScreen';
import { ChatScreen } from './src/ChatScreen';
import { PersonScreen } from './src/PersonScreen';
import { SignInScreen } from './src/SignInScreen';
import type { Profile } from './src/profile';
import { color, ensureWebFonts, font } from './src/theme';
import type { MainTab } from './src/ui/tabs';

ensureWebFonts();

function ProfileGate() {
  const { sessionToken, profile, setProfile } = useApp();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<MainTab>('people');
  const [chat, setChat] = useState<{ matchId: string; profile: Profile } | null>(null);
  const [person, setPerson] = useState<{ matchId?: string; profile: Profile } | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    void api
      .GET('/v1/profiles/me', { headers: { authorization: `Bearer ${sessionToken}` } })
      .then(({ data }) => {
        if (data) setProfile(data as Profile);
      })
      .finally(() => setReady(true));
  }, [sessionToken, setProfile]);

  if (!ready) return <Loading />;
  if (!profile || editing) {
    return <ProfileEditScreen onSaved={() => setEditing(false)} />;
  }
  if (person) {
    return (
      <PersonScreen
        profile={person.profile}
        onBack={() => setPerson(null)}
        onMessage={messageAction(person, setChat, setPerson)}
      />
    );
  }
  if (chat) {
    return (
      <ChatScreen
        match={chat}
        onBack={() => setChat(null)}
        onProfile={() => setPerson({ matchId: chat.matchId, profile: chat.profile })}
      />
    );
  }
  if (tab === 'profile') {
    return (
      <ProfileViewScreen
        onEdit={() => setEditing(true)}
        onPeople={() => setTab('people')}
        onMatches={() => setTab('matches')}
      />
    );
  }
  if (tab === 'matches') {
    return (
      <MatchesScreen
        onOpen={setChat}
        onProfileOf={(item) => setPerson({ matchId: item.matchId, profile: item.profile })}
        onPeople={() => setTab('people')}
        onProfile={() => setTab('profile')}
      />
    );
  }
  return (
    <PoolScreen
      onProfile={() => setTab('profile')}
      onMatches={() => setTab('matches')}
      onChat={(item) => {
        setTab('matches');
        setChat(item);
      }}
    />
  );
}

function messageAction(
  person: { matchId?: string; profile: Profile },
  setChat: (value: { matchId: string; profile: Profile } | null) => void,
  setPerson: (value: null) => void,
) {
  const matchId = person.matchId;
  if (!matchId) return undefined;
  return () => {
    setChat({ matchId, profile: person.profile });
    setPerson(null);
  };
}

function Loading() {
  return (
    <View style={styles.loading}>
      <View style={styles.rule}>
        <Text style={styles.heart}>♥</Text>
      </View>
      <Text style={styles.word}>Here</Text>
    </View>
  );
}

function Root() {
  const { sessionToken } = useApp();
  const [entry, setEntry] = useState<'welcome' | 'join' | 'signin'>('welcome');
  if (sessionToken) return <ProfileGate />;
  if (entry === 'signin') {
    return <SignInScreen onJoin={() => setEntry('join')} onBack={() => setEntry('welcome')} />;
  }
  if (entry === 'join') {
    return <JoinScreen onSignIn={() => setEntry('signin')} onBack={() => setEntry('welcome')} />;
  }
  return (
    <OnboardingScreen onCreate={() => setEntry('join')} onSignIn={() => setEntry('signin')} />
  );
}

export default function App() {
  return (
    <AppProvider>
      <Root />
      <StatusBar style="dark" />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  rule: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.roseSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  word: { color: color.ink, fontFamily: font.display, fontSize: 28, fontWeight: '700' },
  heart: { color: color.rose, fontSize: 20, fontWeight: '700' },
});

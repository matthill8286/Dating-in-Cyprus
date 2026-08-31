import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { api } from './src/api/client';
import { AppProvider, useApp } from './src/context/AppContext';
import { JoinScreen } from './src/JoinScreen';
import { NotifyScreen } from './src/NotifyScreen';
import { OnboardingScreen } from './src/OnboardingScreen';
import { MatchesScreen } from './src/MatchesScreen';
import { MessagesScreen } from './src/MessagesScreen';
import { HostScreen } from './src/HostScreen';
import { ProfileEditScreen } from './src/ProfileEditScreen';
import { ProfileViewScreen } from './src/ProfileViewScreen';
import { ChatScreen } from './src/ChatScreen';
import { PersonScreen } from './src/PersonScreen';
import { SignInScreen } from './src/SignInScreen';
import type { Profile } from './src/profile';
import { color, ensureWebFonts, font } from './src/theme';
import { sessionExpired } from './src/session';
import type { MainTab, TabGo } from './src/ui/tabs';

ensureWebFonts();

function ProfileGate() {
  const { sessionToken, profile, setProfile, setSessionToken } = useApp();
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notify, setNotify] = useState(false);
  const [tab, setTab] = useState<MainTab>('people');
  const [chat, setChat] = useState<{ matchId: string; profile: Profile } | null>(null);
  const [person, setPerson] = useState<{ matchId?: string; profile: Profile } | null>(null);

  useEffect(() => {
    if (!sessionToken) return;
    void api
      .GET('/v1/profiles/me', { headers: { authorization: `Bearer ${sessionToken}` } })
      .then(({ data, response }) => {
        if (data) setProfile(data as Profile);
        else if (sessionExpired(response?.status)) setSessionToken(null);
      })
      .finally(() => setReady(true));
  }, [sessionToken, setProfile, setSessionToken]);

  if (!ready) return <Loading />;
  if (!profile) return <ProfileEditScreen onSaved={() => setNotify(true)} />;
  if (notify) return <NotifyScreen onDone={() => setNotify(false)} />;
  if (editing) return <ProfileEditScreen onSaved={() => setEditing(false)} />;
  const go: TabGo = {
    people: () => setTab('people'),
    matches: () => setTab('matches'),
    messages: () => setTab('messages'),
    profile: () => setTab('profile'),
  };
  if (person || chat) {
    return (
      <OpenMatch
        person={person}
        chat={chat}
        onPerson={setPerson}
        onChat={setChat}
      />
    );
  }
  if (tab === 'profile') {
    return <ProfileViewScreen onEdit={() => setEditing(true)} go={go} />;
  }
  if (tab === 'matches') {
    return (
      <MatchesScreen
        onOpen={(item) => setPerson({ matchId: item.matchId, profile: item.profile })}
        go={go}
      />
    );
  }
  if (tab === 'messages') {
    return <MessagesScreen onOpen={setChat} go={go} />;
  }
  return (
    <HostScreen
      go={go}
      onChat={(item) => {
        setTab('messages');
        setChat(item);
      }}
    />
  );
}

function OpenMatch({
  person,
  chat,
  onPerson,
  onChat,
}: {
  person: { matchId?: string; profile: Profile } | null;
  chat: { matchId: string; profile: Profile } | null;
  onPerson: (value: { matchId?: string; profile: Profile } | null) => void;
  onChat: (value: { matchId: string; profile: Profile } | null) => void;
}) {
  const leave = () => {
    onPerson(null);
    onChat(null);
  };
  if (person) {
    return (
      <PersonScreen
        profile={person.profile}
        onBack={() => onPerson(null)}
        onMessage={messageAction(person, onChat, () => onPerson(null))}
        onBlocked={leave}
        onUnmatched={leave}
        matchId={person.matchId}
      />
    );
  }
  if (!chat) return null;
  return (
    <ChatScreen
      match={chat}
      onBack={() => onChat(null)}
      onProfile={() => onPerson({ matchId: chat.matchId, profile: chat.profile })}
      onBlocked={leave}
      onUnmatched={leave}
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

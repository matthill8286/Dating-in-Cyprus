import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { api } from './api/client';
import { lastMessagePreview } from './chat';
import { useApp } from './context/AppContext';
import type { Profile } from './profile';
import { Hero, MuteNote, Screen, Sheet } from './ui/kit';
import { styles } from './ui/kit.styles';
import { TabBar } from './ui/tabs';

type MatchRow = {
  matchId: string;
  profile: Profile;
  lastMessage: { body: string } | null;
};

export function MatchesScreen({
  onOpen,
  onProfileOf,
  onPeople,
  onProfile,
}: {
  onOpen: (match: MatchRow) => void;
  onProfileOf: (match: MatchRow) => void;
  onPeople: () => void;
  onProfile: () => void;
}) {
  const { sessionToken } = useApp();
  const [matches, setMatches] = useState<MatchRow[]>([]);

  useEffect(() => {
    if (!sessionToken) return;
    void api
      .GET('/v1/matches', { headers: { authorization: `Bearer ${sessionToken}` } })
      .then(({ data }) => {
        if (data?.matches) setMatches(data.matches as MatchRow[]);
      });
  }, [sessionToken]);

  return (
    <Screen
      footer={<TabBar active="matches" onPeople={onPeople} onMatches={() => undefined} onProfile={onProfile} />}
    >
      <Hero kicker="Mutual Interest" title="Matches" subtitle="Chat is open when you both want to meet." />
      <Sheet>
        {matches.map((item) => (
          <View key={item.matchId} style={styles.matchRow}>
            <Pressable
              onPress={() => onProfileOf(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.profile.firstName} profile`}
            >
              {item.profile.photos[0]?.url ? (
                <Image
                  source={{ uri: item.profile.photos[0].url }}
                  style={styles.matchAvatar}
                  accessibilityLabel={item.profile.firstName}
                />
              ) : (
                <View style={styles.matchAvatar} />
              )}
            </Pressable>
            <Pressable onPress={() => onOpen(item)} accessibilityRole="button" style={styles.matchRowBody}>
              <Text style={styles.matchName}>
                {item.profile.firstName}, {item.profile.age}
              </Text>
              <Text style={styles.matchHint}>{lastMessagePreview(item.lastMessage)}</Text>
            </Pressable>
          </View>
        ))}
        {matches.length === 0 ? <MuteNote>No Matches yet. Keep swiping.</MuteNote> : null}
      </Sheet>
    </Screen>
  );
}

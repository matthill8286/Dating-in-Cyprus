import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { api } from './api/client';
import { threadPreview } from './chat';
import { useApp } from './context/AppContext';
import type { Profile } from './profile';
import { Hero, MuteNote, Screen, Sheet } from './ui/kit';
import { styles } from './ui/kit.styles';
import { TabBar } from './ui/tabs';

type MatchRow = { matchId: string; profile: Profile };

export function MatchesScreen({
  onOpen,
  onPeople,
  onProfile,
}: {
  onOpen: (match: MatchRow) => void;
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
          <Pressable
            key={item.matchId}
            onPress={() => onOpen(item)}
            accessibilityRole="button"
            style={styles.matchRow}
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
            <View>
              <Text style={styles.matchName}>
                {item.profile.firstName}, {item.profile.age}
              </Text>
              <Text style={styles.matchHint}>{threadPreview([])}</Text>
            </View>
          </Pressable>
        ))}
        {matches.length === 0 ? <MuteNote>No Matches yet. Keep swiping.</MuteNote> : null}
      </Sheet>
    </Screen>
  );
}

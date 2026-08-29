import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { api } from './api/client';
import { appendLine, canSend, CHAT_POLL_MS, type ChatLine } from './chat';
import { useApp } from './context/AppContext';
import { ChatPerson } from './PersonScreen';
import type { Profile } from './profile';
import { color, font } from './theme';
import { Field, PrimaryButton, Screen, Sheet } from './ui/kit';
import { styles as kit } from './ui/kit.styles';

export function ChatScreen({
  match,
  onBack,
  onProfile,
}: {
  match: { matchId: string; profile: Profile };
  onBack: () => void;
  onProfile: () => void;
}) {
  const { sessionToken } = useApp();
  const { lines, setLines } = useChatThread(sessionToken, match.matchId);
  const [draft, setDraft] = useState('');

  async function send() {
    if (!sessionToken || !canSend(draft)) return;
    const { data } = await api.POST('/v1/matches/{matchId}/messages', {
      headers: { authorization: `Bearer ${sessionToken}` },
      params: { path: { matchId: match.matchId } },
      body: { body: draft.trim() },
    });
    if (data) {
      setLines((prev) => appendLine(prev, data));
      setDraft('');
    }
  }

  return (
    <Screen>
      <Sheet>
        <View style={styles.bar}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <ChatPerson profile={match.profile} onPress={onProfile} />
        </View>
        {lines.length === 0 ? <EmptyThread profile={match.profile} onPress={onProfile} /> : null}
        {lines.map((line) => (
          <View key={line.messageId} style={line.fromMe ? kit.bubbleMe : kit.bubbleThem}>
            <Text style={line.fromMe ? kit.bubbleMeText : kit.bubbleThemText}>{line.body}</Text>
          </View>
        ))}
        <Field label="Message" value={draft} onChangeText={setDraft} placeholder="Write a message" />
        <PrimaryButton title="Send" onPress={() => void send()} />
      </Sheet>
    </Screen>
  );
}

function EmptyThread({ profile, onPress }: { profile: Profile; onPress: () => void }) {
  const uri = profile.photos[0]?.url;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${profile.firstName} profile`}>
      {uri ? (
        <Image source={{ uri }} style={styles.hero} accessibilityLabel={profile.firstName} />
      ) : null}
      <Text style={styles.hello}>You matched with {profile.firstName}.</Text>
      <Text style={kit.matchHint}>Tap to see their photos and bio. Then say hello.</Text>
    </Pressable>
  );
}

function useChatThread(sessionToken: string | null, matchId: string) {
  const [lines, setLines] = useState<ChatLine[]>([]);

  useEffect(() => {
    if (!sessionToken) return;
    let cancelled = false;
    const load = async () => {
      const { data } = await api.GET('/v1/matches/{matchId}/messages', {
        headers: { authorization: `Bearer ${sessionToken}` },
        params: { path: { matchId } },
      });
      if (!cancelled && data?.messages) setLines(data.messages);
    };
    void load();
    const timer = setInterval(() => void load(), CHAT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sessionToken, matchId]);

  return { lines, setLines };
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  back: { color: color.rose, fontFamily: font.body, fontSize: 15, fontWeight: '600', paddingRight: 4 },
  hero: { width: '100%', height: 280, borderRadius: 24, backgroundColor: color.surface },
  hello: {
    fontFamily: font.display,
    fontSize: 20,
    fontWeight: '700',
    color: color.ink,
    marginTop: 12,
  },
});

import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { api } from './api/client';
import { appendLine, canSend, CHAT_POLL_MS, type ChatLine } from './chat';
import { useApp } from './context/AppContext';
import { ChatPerson } from './PersonScreen';
import type { Profile } from './profile';
import { color, font } from './theme';
import { Fixed } from './ui/deck';
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
    <Fixed
      footer={
        <Composer value={draft} onChange={setDraft} onSend={() => void send()} />
      }
    >
      <View style={styles.page}>
        <View style={styles.bar}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <ChatPerson profile={match.profile} onPress={onProfile} />
        </View>
        <ScrollView style={styles.thread} contentContainerStyle={styles.threadInner}>
          {lines.length === 0 ? <EmptyThread profile={match.profile} onPress={onProfile} /> : null}
          {lines.map((line) => (
            <View key={line.messageId} style={line.fromMe ? kit.bubbleMe : kit.bubbleThem}>
              <Text style={line.fromMe ? kit.bubbleMeText : kit.bubbleThemText}>{line.body}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Fixed>
  );
}

function Composer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <View style={styles.composer}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Your message"
        placeholderTextColor={color.mute}
        accessibilityLabel="Message"
        style={styles.input}
        onSubmitEditing={onSend}
      />
      <Pressable
        onPress={onSend}
        accessibilityRole="button"
        accessibilityLabel="Send"
        style={styles.send}
      >
        <Text style={styles.sendMark}>➤</Text>
      </Pressable>
    </View>
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
  page: { flex: 1, width: '100%', maxWidth: 430, alignSelf: 'center', paddingHorizontal: 16 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 8, paddingBottom: 12 },
  back: { color: color.ink, fontFamily: font.body, fontSize: 28, fontWeight: '400', paddingRight: 4, paddingLeft: 4 },
  thread: { flex: 1 },
  threadInner: { gap: 8, paddingBottom: 12, flexGrow: 1 },
  hero: { width: '100%', height: 220, borderRadius: 24, backgroundColor: color.surface },
  hello: {
    fontFamily: font.display,
    fontSize: 20,
    fontWeight: '700',
    color: color.ink,
    marginTop: 12,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: color.paper,
    borderTopWidth: 1,
    borderTopColor: color.line,
  },
  input: {
    flex: 1,
    fontFamily: font.body,
    fontSize: 16,
    color: color.ink,
    backgroundColor: color.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendMark: { color: color.onRose, fontSize: 16, fontWeight: '700' },
});

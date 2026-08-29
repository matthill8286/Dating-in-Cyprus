import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from './api/client';
import { appendLine, canSend, type ChatLine } from './chat';
import { useApp } from './context/AppContext';
import type { Profile } from './profile';
import { Field, GhostButton, PrimaryButton, Screen, Sheet } from './ui/kit';
import { styles } from './ui/kit.styles';

export function ChatScreen({
  match,
  onBack,
}: {
  match: { matchId: string; profile: Profile };
  onBack: () => void;
}) {
  const { sessionToken } = useApp();
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!sessionToken) return;
    void api
      .GET('/v1/matches/{matchId}/messages', {
        headers: { authorization: `Bearer ${sessionToken}` },
        params: { path: { matchId: match.matchId } },
      })
      .then(({ data }) => {
        if (data?.messages) setLines(data.messages);
      });
  }, [sessionToken, match.matchId]);

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
        <GhostButton title={`Back · ${match.profile.firstName}`} onPress={onBack} />
        {lines.map((line) => (
          <View key={line.messageId} style={line.fromMe ? styles.bubbleMe : styles.bubbleThem}>
            <Text style={line.fromMe ? styles.bubbleMeText : styles.bubbleThemText}>{line.body}</Text>
          </View>
        ))}
        {lines.length === 0 ? (
          <Text style={styles.matchHint}>Say hello to {match.profile.firstName}.</Text>
        ) : null}
        <Field label="Message" value={draft} onChangeText={setDraft} placeholder="Write a message" />
        <PrimaryButton title="Send" onPress={() => void send()} />
      </Sheet>
    </Screen>
  );
}

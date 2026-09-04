import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { ChatPerson } from './PersonScreen';
import type { Profile } from './profile';
import { useChatThread } from './queries/chat';
import { OpenSafetySheet } from './SafetySheet';
import { color, font } from './theme';
import { Fixed } from './ui/deck';
import { ErrorNote } from './ui/kit';
import { asText } from './ui/mark';
import { page as pageLayout } from './ui/layout';
import { styles as kit } from './ui/kit.styles';
import { ChatSkeleton } from './ui/skeleton';

export function ChatScreen({
  match,
  onBack,
  onProfile,
  onBlocked,
  onUnmatched,
}: {
  match: { matchId: string; profile: Profile };
  onBack: () => void;
  onProfile: () => void;
  onBlocked: () => void;
  onUnmatched: () => void;
}) {
  const { sessionToken } = useApp();
  const thread = useChatThread(sessionToken, match.matchId);
  const [draft, setDraft] = useState('');
  const [safety, setSafety] = useState(false);

  return (
    <Fixed
      footer={
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => {
            thread.send(draft);
            setDraft('');
          }}
        />
      }
    >
      <View style={styles.page}>
        <ChatBar
          profile={match.profile}
          onBack={onBack}
          onProfile={onProfile}
          onSafety={() => setSafety(true)}
        />
        <ScrollView
          style={styles.thread}
          contentContainerStyle={styles.threadInner}
          onScroll={({ nativeEvent }) => {
            if (nativeEvent.contentOffset.y <= 0) thread.loadOlder();
          }}
          scrollEventThrottle={200}
        >
          {!thread.ready ? <ChatSkeleton /> : null}
          {thread.ready && thread.lines.length === 0 ? (
            <EmptyThread profile={match.profile} onPress={onProfile} />
          ) : null}
          {thread.lines.map((line) => (
            <View key={line.messageId} style={line.fromMe ? kit.bubbleMe : kit.bubbleThem}>
              <Text style={line.fromMe ? kit.bubbleMeText : kit.bubbleThemText}>{line.body}</Text>
            </View>
          ))}
          <ErrorNote message={thread.sendFailed ? 'That message did not send.' : null} />
        </ScrollView>
      </View>
      <OpenSafetySheet
        open={safety}
        name={match.profile.firstName}
        profileId={match.profile.profileId}
        matchId={match.matchId}
        token={sessionToken}
        onClose={() => setSafety(false)}
        onBlocked={() => {
          setSafety(false);
          onBlocked();
        }}
        onUnmatched={() => {
          setSafety(false);
          onUnmatched();
        }}
      />
    </Fixed>
  );
}

function ChatBar({
  profile,
  onBack,
  onProfile,
  onSafety,
}: {
  profile: Profile;
  onBack: () => void;
  onProfile: () => void;
  onSafety: () => void;
}) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.back}>‹</Text>
      </Pressable>
      <ChatPerson profile={profile} onPress={onProfile} />
      <Pressable
        onPress={onSafety}
        accessibilityRole="button"
        accessibilityLabel="More"
        style={styles.more}
      >
        <Text style={styles.moreMark}>⋯</Text>
      </Pressable>
    </View>
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
        <Text style={styles.sendMark}>{asText('➤')}</Text>
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

const styles = StyleSheet.create({
  page: { flex: 1, ...pageLayout, paddingHorizontal: 16 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 8, paddingBottom: 12 },
  back: { color: color.ink, fontFamily: font.body, fontSize: 28, fontWeight: '400', paddingRight: 4, paddingLeft: 4 },
  more: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  moreMark: { color: color.ink, fontFamily: font.body, fontSize: 22, fontWeight: '700', lineHeight: 24 },
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

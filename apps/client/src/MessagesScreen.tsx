import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { lastMessagePreview, messageClock } from './chat';
import { useApp } from './context/AppContext';
import { searchInbox, splitInbox, type InboxRow } from './match';
import { MuteNote, Screen, Sheet } from './ui/kit';
import { MessageListSkeleton } from './ui/skeleton';
import { TabBar, type TabGo } from './ui/tabs';
import { color, font } from './theme';
import { useMatches } from './useMatches';

export function MessagesScreen({
  onOpen,
  go,
}: {
  onOpen: (match: InboxRow) => void;
  go: TabGo;
}) {
  const { sessionToken } = useApp();
  const { matches, ready } = useMatches(sessionToken);
  const [query, setQuery] = useState('');
  const { fresh, threads } = splitInbox(matches);
  const searching = query.trim().length > 0;
  const rows = searchInbox(searching ? matches : threads, query);

  return (
    <Screen footer={<TabBar active="messages" go={go} />}>
      <View style={styles.head}>
        <Text style={styles.title}>Messages</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={color.mute}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search messages"
          style={styles.search}
        />
      </View>
      <Sheet>
        {!ready ? (
          <MessageListSkeleton />
        ) : (
          <>
            {!searching && fresh.length > 0 ? <FreshTray items={fresh} onOpen={onOpen} /> : null}
            {rows.map((item) => (
              <ThreadRow key={item.matchId} item={item} onPress={() => onOpen(item)} />
            ))}
            {rows.length === 0 ? (
              <MuteNote>{searching ? 'No matches with that name.' : 'No messages yet. Say hello.'}</MuteNote>
            ) : null}
          </>
        )}
      </Sheet>
    </Screen>
  );
}

function FreshTray({ items, onOpen }: { items: InboxRow[]; onOpen: (item: InboxRow) => void }) {
  return (
    <View style={styles.trayBlock}>
      <Text style={styles.trayLabel}>New matches</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tray}>
        {items.map((item) => (
          <Pressable
            key={item.matchId}
            onPress={() => onOpen(item)}
            accessibilityRole="button"
            accessibilityLabel={item.profile.firstName}
            style={styles.fresh}
          >
            {item.profile.photos[0]?.url ? (
              <Image
                source={{ uri: item.profile.photos[0].url }}
                style={styles.freshPhoto}
                accessibilityLabel={item.profile.firstName}
              />
            ) : (
              <View style={styles.freshPhoto} />
            )}
            <Text style={styles.freshName} numberOfLines={1}>
              {item.profile.firstName}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function ThreadRow({ item, onPress }: { item: InboxRow; onPress: () => void }) {
  const uri = item.profile.photos[0]?.url;
  const last = item.lastMessage;
  const preview = last ? (last.fromMe ? `You: ${last.body}` : last.body) : lastMessagePreview(last);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Message ${item.profile.firstName}`}
      style={styles.row}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.avatar} accessibilityLabel={item.profile.firstName} />
      ) : (
        <View style={styles.avatar} />
      )}
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name}>{item.profile.firstName}</Text>
          <Text style={styles.time}>{messageClock(last?.sentAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8, maxWidth: 430, alignSelf: 'center', width: '100%', gap: 12 },
  title: { fontFamily: font.display, fontSize: 28, fontWeight: '700', color: color.ink },
  search: {
    fontFamily: font.body,
    fontSize: 16,
    color: color.ink,
    backgroundColor: color.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trayBlock: { gap: 10, marginBottom: 8 },
  trayLabel: { fontFamily: font.body, fontSize: 13, fontWeight: '600', color: color.mute },
  tray: { gap: 14, paddingRight: 8 },
  fresh: { width: 72, alignItems: 'center', gap: 6 },
  freshPhoto: { width: 64, height: 64, borderRadius: 32, backgroundColor: color.surface },
  freshName: { fontFamily: font.body, fontSize: 12, fontWeight: '600', color: color.ink, maxWidth: 72 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: color.line },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: color.surface },
  body: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontFamily: font.display, fontSize: 17, fontWeight: '700', color: color.ink, flex: 1 },
  time: { fontFamily: font.body, fontSize: 12, color: color.mute },
  preview: { fontFamily: font.body, fontSize: 14, color: color.mute, marginTop: 2 },
});

import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { canDecide, HOST_OPENING, hostLines, type HostLine } from './host';
import { HostHeader, HostMessage, IslandBack, VerbRow } from './hostChrome';
import { IslandMap } from './IslandMap';
import type { Profile } from './profile';
import { OpenSafetySheet } from './SafetySheet';
import { color, font } from './theme';
import { Fixed } from './ui/deck';
import { TabBar, type TabGo } from './ui/tabs';
import { useHost } from './useHost';

export function HostScreen({
  go,
  onChat,
}: {
  go: TabGo;
  onChat: (match: { matchId: string; profile: Profile }) => void;
}) {
  const { sessionToken } = useApp();
  const host = useHost(sessionToken);
  const [island, setIsland] = useState(false);
  const [safety, setSafety] = useState(false);
  const tabs = <TabBar active="people" go={go} />;

  if (island) {
    return <IslandStage people={host.people} footer={tabs} onBack={() => setIsland(false)} />;
  }

  return (
    <Fixed footer={tabs}>
      <ScrollView contentContainerStyle={styles.thread} style={styles.scroll}>
        <HostHeader
          onIsland={() => setIsland(true)}
          onSafety={host.introduction ? () => setSafety(true) : undefined}
        />
        <View style={styles.lines}>
          {threadFor(host).map((line) => (
            <HostMessage key={line.id} line={line} />
          ))}
        </View>
        {canDecide(host.introduction, host.busy, host.matched) ? (
          <VerbRow
            onYes={host.yes}
            onPass={host.pass}
            onMore={host.more}
            showMore={!host.revealed}
          />
        ) : null}
        <WriteToMatch match={host.matched} profile={host.matchProfile} onChat={onChat} />
      </ScrollView>
      <OpenSafetySheet
        open={safety}
        name={host.introduction?.firstName ?? ''}
        profileId={host.introduction?.profileId ?? ''}
        token={sessionToken}
        onClose={() => setSafety(false)}
        onBlocked={() => {
          setSafety(false);
          host.reload();
        }}
      />
    </Fixed>
  );
}

function IslandStage({
  people,
  footer,
  onBack,
}: {
  people: Profile[];
  footer: ReactNode;
  onBack: () => void;
}) {
  return (
    <Fixed footer={footer}>
      <IslandMap people={people} city="all" onOpen={() => undefined} />
      <IslandBack onBack={onBack} />
    </Fixed>
  );
}

function threadFor(host: {
  ready: boolean;
  introduction: Parameters<typeof hostLines>[0]['introduction'];
  revealed: boolean;
  verb: Parameters<typeof hostLines>[0]['verb'];
  matched: Parameters<typeof hostLines>[0]['matched'];
}): HostLine[] {
  if (!host.ready) return [{ id: 'open', kind: 'host', body: HOST_OPENING }];
  return hostLines(host);
}

function WriteToMatch({
  match,
  profile,
  onChat,
}: {
  match: { matchId: string; firstName: string } | null;
  profile: Profile | null;
  onChat: (item: { matchId: string; profile: Profile }) => void;
}) {
  if (!match || !profile) return null;
  return (
    <Pressable
      onPress={() => onChat({ matchId: match.matchId, profile })}
      accessibilityRole="button"
      accessibilityLabel={`Write to ${match.firstName}`}
      style={styles.write}
    >
      <Text style={styles.writeText}>Write to {match.firstName}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  thread: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 28,
  },
  lines: { gap: 22 },
  write: {
    backgroundColor: color.ink,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  writeText: { color: color.onRose, fontFamily: font.body, fontSize: 16, fontWeight: '700' },
});
